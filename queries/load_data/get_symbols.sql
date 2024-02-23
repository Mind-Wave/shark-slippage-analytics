SELECT DISTINCT replace(name,'tbl_','') AS name FROM `system`.tables
WHERE database = 'db_candles_binance_futures' AND name LIKE '%USDT'
ORDER BY metadata_modification_time
FORMAT JSON