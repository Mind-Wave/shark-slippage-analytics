SELECT * 
FROM db_analytics.tbl_volume_volatility_{tf}
WHERE symbol = '{symbol}' AND ts >= {ts_start} AND ts <= {ts_finish}
ORDER BY ts
FORMAT JSON