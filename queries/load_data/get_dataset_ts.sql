SELECT * 
FROM db_analytics.tbl_volume_volatility_{tf}
WHERE symbol = '{symbol}' AND ts IN ({timestamps})
ORDER BY ts
FORMAT JSON