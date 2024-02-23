require('dotenv').config();

const API_PORT = +process.env.PORT || 8080;

const cron = require('node-cron');
const express = require("express");
const url = require('url');
const converter = require('json-2-csv');

DB = require(`./connectors/DB`);
BINANCE = require(`./connectors/BINANCE`);
MATH_FUNCTIONS = require(`./connectors/math`);


//TIMEFRAMES = ['1d','6h','1h','15m','5m','1m'];
TIMEFRAMES = ['1m'];

// init api
var app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended : true}));
//


app.listen(`${API_PORT}`,async () => {
    console.log('INFO',"API-Server running on port " + API_PORT);
});

app.get("/", async (req, res) => {
    res.status(200).json({ result : 'Api of APP!'});  
});

app.get("/get_dataset", async (req, res) => {
    try {
        let url_parts = url.parse(req.url, true);
        let symbol = url_parts.query.symbol || '';
        let tf = url_parts.query.tf || '1m';
        let tsStart = url_parts.query.ts_start || 0;
        let tsEnd = url_parts.query.ts_end || Date.now();
        let asCsv = url_parts.query.as_csv || 0;

        if (tsStart == 0) res.status(200).send("ts_start is required param!");
        else if (tf != '1m')  res.status(200).send("tf must be 1m!");
        else {
            if (asCsv == 1 || asCsv == true || asCsv == 'true') {
                let result = [];
                if (!symbol.includes('USDT') && symbol != '') symbol += 'USDT';
                let ordersReport = await DB.getOrdersReport(symbol,tsStart,tsEnd);
                for (let i = 0; i < ordersReport.length; i++) {
                    const r = ordersReport[i];
                    let Slippage_usdt;
                    if (r[12] === 'BUY') {
                        Slippage_usdt = (r[7] - r[8]) * (r[9] / r[8]);
                    } else if (r[12] === 'SELL') {
                        Slippage_usdt = (r[8] - r[7]) * (r[9] / r[8]);
                    } else Slippage_usdt = 0;

                    result.push({
                        dt : r[1],
                        ts : +r[2],
                        market : r[0],
                        asset : r[4],
                        side : r[12],
                        order_type : r[13],
                        account_id : +r[5],
                        grid_id : r[6],
                        trigger_price : r[7],
                        real_price : r[8],
                        "order_volume usdt" : +r[9].toFixed(2),
                        "price_diff %" : r[10],
                        "volume_diff %" : r[23],
                        "slippage usdt" : +Slippage_usdt.toFixed(8),
                        "1_min_volatility" : r[17],
                        "2_min_volatitily" : r[19],
                        "14_min_volatitily" : r[21],
                        "1_min_volume usdt" : r[18],
                        "2_min_volume_diff %" : r[20],
                        "14_min_volume_diff %" : r[22]
                    })
                }
                const csv = await converter.json2csv(result);
                res.attachment(`slippage_analytics_${symbol === '' ? 'all':symbol}_${Date.now()}.csv`);
                res.status(200).send(csv);
            } else {
                if (!symbol.includes('USDT') && symbol != '') symbol += 'USDT';
                let result = await DB.getData(symbol,tf,tsStart,tsEnd);
                res.status(200).send(result);
            }
        }
    } catch (error) {
        console.log(error);
        console.log('ERROR','get_dataset',error.message);
        res.status(503).json({"result": error.message});
    }
});

async function main() {
    try {
        await DB.init();
        cron.schedule('45 */1 * * * *', async() => { 
            try {
                //let symbols = await BINANCE.getSymbols();
                let symbols = await DB.getSymbols(); // read symbols list from our db to garantee we have data for symbol                                
                for (let j = 0; j < TIMEFRAMES.length; j++) {
                    const tf = TIMEFRAMES[j];
                    if (checkTf(tf) === true)
                        await calculate(symbols,tf);                            
                }
            } catch (error) {
                console.log('ERROR','index.main',error.message);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

async function calculate(symbols,tf) {
    try {
        let fullResult = [];
        let tfMinutes = convertTf(tf);
        let candles = await DB.getCandles(symbols,Date.now()-1000*60*tfMinutes*15,Math.floor(Date.now()/1000/60/tfMinutes)*1000*60*tfMinutes,tfMinutes);
        if (candles.length) {
            for (let i = 0; i < symbols.length; i++) {
                let symbolCandles = candles.filter(e => e.symbol == symbols[i]);
                if (symbolCandles.length) {
                    symbolCandles.sort((a, b) => (a.ts > b.ts) ? 1 : -1);
                    let symbolResult = MATH_FUNCTIONS.processData(symbolCandles,symbols[i]);
                    fullResult.push(symbolResult);
                }
            }
        }
        console.log(`[ ${Date.now()} ] Calculated and saved new data for ${tf} tf (${fullResult.length} symbols)`);
        if (fullResult.length)
            DB.save(fullResult,tf);
    } catch (error) {
        console.log(error);
    }
}

function convertTf(tf) {
    if (tf.includes('m'))
        return +tf.replace('m','');
    else if (tf.includes('h'))
        return +tf.replace('h','')*60;
    else if (tf.includes('d'))
        return +tf.replace('d','')*60*24;
}

function checkTf(tf) {
    let isCoinTf = false;
    let currentHour = new Date().getHours();;
    let currentMinute = new Date().getMinutes();
    if (tf == '1m') isCoinTf = true;
    else if (tf == '5m' && (currentMinute == 0 || currentMinute%5 == 0)) isCoinTf = true;
    else if (tf == '15m' && (currentMinute == 0 || currentMinute%15 == 0)) isCoinTf = true;
    else if (tf == '1h' && currentMinute == 0 ) isCoinTf = true;
    else if (tf == '6h' && (currentMinute == 0 && currentHour%6 == 0)) isCoinTf = true;
    else if (tf == '1d' && (currentMinute == 0 && currentHour == 0)) isCoinTf = true;
    if (isCoinTf === true)
        return true;
    else 
        return false;
}

main();

//recalcHistory();

async function recalcHistory() {
    const tsStart = 1696517460000;
    const tsEnd = 1699533840000;
    await DB.init();
    const symbols = await DB.getSymbols(); // read symbols list from our db to garantee we have data for symbol  
    for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i];
        console.log(s,i,'of',symbols.length);
        let symbolResult = [];
        let candles = await DB.getCandles([s],tsStart+1 - 1000*60*15,tsEnd,'1');
        candles.sort((a, b) => (a.ts > b.ts) ? 1 : -1);
        for (let j = 15; j < candles.length; j++) {
            const symbolCandles = candles.slice(j-14, j);
            let r = MATH_FUNCTIONS.processData(symbolCandles,s);
            symbolResult.push(r);
        }
        DB.save(symbolResult,'1m',true)
    }     
    console.log('Finished');
}