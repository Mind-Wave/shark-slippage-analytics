SELECT ts,
	toDateTime(ts/1000) AS dt,
	MIN(l) AS low,
	MAX(h) AS high,
	argMax(c, ts_start) AS close,
	argMin(o, ts_start) AS open,
	SUM(volume_base) AS volume_base,
	SUM(volume_quote) AS volume_quote,
	'{symbol}' AS symbol
FROM (
	SELECT FLOOR(ts_start/1000/60/{tf})*1000*60*{tf} AS ts,ts_start,
		open AS o,high AS h,low AS l, close AS c,
		volume_base,volume_quote 
	FROM db_candles_binance_futures.tbl_{symbol} tb 
    WHERE ts_start >= {ts_start} 
        AND ts_start < {ts_finish} 
	ORDER BY ts
)
GROUP BY ts
ORDER BY ts 
