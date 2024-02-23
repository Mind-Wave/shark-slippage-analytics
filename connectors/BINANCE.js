const axios = require(`axios`);
const BINANCE_URL = 'https://fapi.binance.com';

/**
 * 
 * @returns sumbols list to save candles
 */
async function getSymbols(){
    try {
        let url = BINANCE_URL + '/fapi/v1/exchangeInfo';
        let {data} = await axios.get(url);
        let symbolsData = data.symbols.filter(e => e.status=='TRADING' && e.symbol.includes('USDT')).map(e=>e.symbol);
        return symbolsData;
    } catch (error) {
        console.log('ERROR','binance_futures.binance.getSymbols','CAN NOT LOAD SYMBOLS LIST. ' + error.message)
    }
}

exports.getSymbols = getSymbols;