
function processData(candles,symbol) { // гарантировать что сюда не попадет не полная свеча последняя
    let lastCandle = candles[candles.length-1]; // current min
    let preLastCandle = candles[candles.length-2]; // 1 min ago
    let prePreLastCandle = candles[candles.length-3]; // 2 min ago
    let firstCandle = candles[0]; // 14 min ago

    let result = {
        ts: lastCandle.ts,
        symbol : symbol,
        volume_absolute_tf: +lastCandle.volume_quote.toFixed(2),
        volatility_tf: +( ( lastCandle.close - lastCandle.open ) / ( ( lastCandle.close + lastCandle.open ) / 2 )),
        volatility_2 : +(calcVolatility([candles[candles.length-2],candles[candles.length-1]])),
        volatility_14 : +(calcVolatility(candles)),
        volume_2 :  100 * ( (lastCandle.volume_quote - prePreLastCandle.volume_quote) / prePreLastCandle.volume_quote ),
        volume_14 : 100 * ( (lastCandle.volume_quote - firstCandle.volume_quote) / firstCandle.volume_quote ), 
        volume_diff : 100 * ( (lastCandle.volume_quote - preLastCandle.volume_quote) / preLastCandle.volume_quote )

    };

    return result;
}

function calcVolatility(candles) {
    let averagePrice = candles.reduce((total, next) => total + next.close, 0) / candles.length;
    let priceDiffsSquared = [];
    for (let i = 0; i < candles.length; i++)
        priceDiffsSquared.push(Math.pow((candles[i].close - averagePrice),2));
    
    let sum = priceDiffsSquared.reduce((a, b) => a + b, 0);
    let variance = sum / candles.length;
    let volatility = Math.sqrt(variance);
    return volatility / candles[candles.length-1].close*100;
}

exports.processData = processData;