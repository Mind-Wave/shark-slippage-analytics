SELECT * 
FROM db_analytics.tbl_volume_volatility_{tf}
WHERE ts IN ({timestamps}) AND symbol IN ({symbols})
ORDER BY ts
FORMAT JSON