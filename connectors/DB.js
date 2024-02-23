const fs = require('fs');
const ClickHouse = require('@apla/clickhouse');

db = {};

async function init(createTables = true) {
    try {
        await db_reconnect();
        if (createTables === true)
            await createAllTables();
    } catch (error) {
        console.log('ERROR','DB.init',error.message);
    }
};

async function createAllTables() {
    try {
        let queryTemplate = fs.readFileSync('./queries/create_table/template.sql','utf-8');
        for (let i = 0; i < TIMEFRAMES.length; i++) {
            const tf = TIMEFRAMES[i];
            let query = queryTemplate.replace('{tf}',tf);
            await db.querying(query);
        }
    } catch (error) {
        db = await db_reconnect();
    }
}

async function getCandles(symbols,ts_start,ts_finish,tf) {
    try {
        return new Promise((resolve, reject) => {
            let data = [];
            let sqlTemplate = fs.readFileSync('./queries/load_data/get_candles.sql','utf-8');
            let fullSql = '';
            for (let i = 0; i < symbols.length; i++) {
                const s = symbols[i];
                fullSql += sqlTemplate
                    .replace('{ts_start}',ts_start)
                    .replace('{ts_finish}',ts_finish)
                    .replace(/{tf}/g,tf)
                    .replace(/{symbol}/g,s);
                if (i != symbols.length - 1)
                    fullSql += 'UNION ALL\n';
                else 
                    fullSql += 'FORMAT JSON';
            }
            const stream = db.query(fullSql);
            stream.on('data', (row) => data.push(row))
            stream.on('error', (err) => {
                console.log('CAN NOT LOAD CANDLES. symbol:',symbols.join(','));
                resolve([]);
            });
            stream.on('end', () => {
                resolve(data);
            })
        });
    } catch (error) {
        db = await db_reconnect();
        console.log(error);
        return [];
    }
}

async function getVolVolatility(symbol,timestamps,symbols,tf) {
    try {
        return new Promise((resolve, reject) => {
            let data = [];
            let sql = ( symbol === '' ? 
                fs.readFileSync('./queries/load_data/get_dataset_full_ts.sql','utf-8') : 
                fs.readFileSync('./queries/load_data/get_dataset_ts.sql','utf-8')
            );
            sql = sql.replace('{timestamps}',timestamps).replace('{symbols}',symbols).replace('{symbol}',symbol).replace(/{tf}/g,tf);
            const stream = db.query(sql);
            stream.on('data', (row) => data.push(row))
            stream.on('error', (err) => {
                console.log(sql,'CAN NOT LOAD ORDERS REPORT DATA. symbol:',symbol);
                resolve([]);
            });
            stream.on('end', () => {
                resolve(data);
            })
        });
    } catch (error) {
        console.log(error);
        db = db_reconnect();
        return [];
    }
}


async function getOrdersReport(symbol,ts_start,ts_finish) {
    try {
        return new Promise((resolve, reject) => {
            let data = [];
            let sql = ( symbol === '' ? 
                fs.readFileSync('./queries/load_data/get_orders_report_full.sql','utf-8') : 
                fs.readFileSync('./queries/load_data/get_orders_report.sql','utf-8')
            );
            sql = sql.replace('{ts_start}',ts_start).replace('{ts_finish}',ts_finish).replace('{asset}',symbol.replace('USDT',''));
            var stream = db.query(sql);
            stream.on('data', (row) => data.push(row))
            stream.on('error', (err) => {
                console.log(sql,'CAN NOT LOAD ORDERS REPORT DATA. symbol:',symbol,err);
                resolve([]);
            });
            stream.on('end', () => {
                resolve(data);
            })
        });
    } catch (error) {
        console.log(error);
        db = db_reconnect();
        return [];
    }
}


function save(dataToSave,tf,isTmpTable = false) {
    try {
        let query = `INSERT INTO db_analytics.tbl_volume_volatility_${tf}${isTmpTable == false ? '' : '_recalc'} (ts,symbol,volatility_tf,volume_tf,volatility_2_tf,volume_diff_2_tf,volatility_14_tf,volume_diff_14_tf,volume_diff) FORMAT TSV`;
        const writableStream = db.query(query, (err) => { if (err) console.error('DB LOG WRITE STREAM ERROR :',err); });
        writableStream.on("error",e => { 
            console.log('ERROR','DB.save','ERROR WRITING TO DB');
        });
        for (let i = 0; i < dataToSave.length; i++) {
            const data = dataToSave[i];
            let values = `${data.ts}\t${data.symbol}\t${data.volatility_tf}\t${data.volume_absolute_tf}\t${data.volatility_2}\t${data.volume_2}\t${data.volatility_14}\t${data.volume_14}\t${data.volume_diff}`;
            writableStream.write(values);   
        }
        writableStream.end();
    } catch (error) {
        console.log(error);
        db = db_reconnect();
    }
}

async function getData(symbol,tf,ts_start,ts_finish) {
    try {
        return new Promise((resolve, reject) => {
            let data = [];
            let sql = ( symbol === '' ? 
                fs.readFileSync('./queries/load_data/get_dataset_full.sql','utf-8') : 
                fs.readFileSync('./queries/load_data/get_dataset.sql','utf-8')
            );
            sql = sql.replace('{ts_start}',ts_start).replace('{ts_finish}',ts_finish).replace(/{tf}/g,tf).replace('{symbol}',symbol);
            const stream = db.query(sql);
            stream.on('data', (row) => data.push(row))
            stream.on('error', (err) => {
                console.log(sql,'CAN NOT LOAD DATA. symbol:',symbol);
                resolve([]);
            });
            stream.on('end', () => {
                resolve(data);
            })
        });
    } catch (error) {
        console.log(error);
        db = db_reconnect();
        return [];
    }
}

async function getSymbols() {
    try {
        return new Promise((resolve, reject) => {
            let data = [];
            let sql = fs.readFileSync('./queries/load_data/get_symbols.sql','utf-8');
            const stream = db.query(sql);
            stream.on('data', (row) => data.push(row))
            stream.on('error', (err) => {
                resolve([]);
            });
            stream.on('end', () => {
                resolve(data.map(e=>e.name));
            })
        });
    } catch (error) {
        db = db_reconnect();
        console.log(error);
        return [];
    }
}


async function db_reconnect(mode = 'connect'){ // add connection to db with db_analytics to save data
    return new Promise((resolve, reject) => {
        try {
            db = new ClickHouse({
                host:process.env.DB_CANDLES_HOST,
                port:process.env.DB_CANDLES_PORT,
                user:process.env.DB_CANDLES_USER,
                password:process.env.DB_CANDLES_PASSWORD
            });
            console.log('INFO','DB.db_reconnect',mode == 'connect' ? 'CONNECTED TO DB' :'RECONNECT DB.');
            resolve(db);
        } catch (error) {
            console.log('ERROR','DB.db_reconnect',error.message);
            console.log('INFO','DB.db_reconnect','CAN NOT ' + ( mode == 'connect' ? mode : 'reconnect' ) +  ' TO DB.');
            resolve({});
        }   
    });
}


exports.init = init;
exports.getCandles = getCandles;
exports.save = save;
exports.getData = getData;
exports.getSymbols = getSymbols;
exports.getOrdersReport = getOrdersReport;
exports.getVolVolatility = getVolVolatility;