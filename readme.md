This service is made for analytics of volatility, volume and slippages

Calculating Params: 

Timeframes : 1m
Symbols : All currently trading binance pairs (if we have candles)

volatility for tf (percents), 100 * ( close - open ) / ( ( close + open ) / 2 )

volatility in last 2 tf , https://corporatefinanceinstitute.com/resources/career-map/sell-side/capital-markets/volatility-vol/ 

volatility in last 14 tf, https://corporatefinanceinstitute.com/resources/career-map/sell-side/capital-markets/volatility-vol/ 


volume diff in last 2 tf (percents) : 100 * ( last_tf_volume - prev_tf_volume ) / ( ( last_tf_volume + prev_tf_volume ) / 2 ) , 

volume diff in last 14 tf (percents) : 100 * ( last_tf_volume - 14_tf_back_volume ) / ( ( last_tf_volume + 14_tf_back_volume ) / 2 ) ,  

volume for tf (absolute)




DB: db_analytics in candles clickhouse


##
ENVS

| PARAM | DB_CANDLES_USER | DB_CANDLES_PORT | DB_CANDLES_HOST | DB_CANDLES_PASSWORD | PORT |
| :---: | :---: | :---: |  :---: | :---: | :---: |
| Required | YES | YES | YES |  YES | NO |
| NOTE | - | - | - | - | Port for Rest Api to run on |
| DEFAULT | no | no | no | no |  8080 |

##
Endpoints

### 1) Get dataset
`GET /get_dataset`
`http://127.0.0.1:8080/get_dataset?tf=1m&ts_start=1696423566000&symbol=LTC&ts_end=1696427100000&as_csv=1` 


| PARAM | symbol | ts_end | ts_start | tf |  as_csv |
| :---: | :---: | :---: |  :---: | :---: | :---: |
| Required | NO | NO | YES | NO |  NO |  NO |
| NOTE | symbol name (BTC/BTCUSDT) | Timestamp in miliseconds | Timestamp in miliseconds | 1m | load full csv result or not |
| DEFAULT | no | Date.now() | no | no | 0 |

