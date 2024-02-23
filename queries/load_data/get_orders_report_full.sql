SELECT * 
FROM (
	SELECT 
		market,
		toDateTime(ts/1000, 'UTC') AS dt,
		ts,
		toUInt64(floor(ts/60000)*60000) AS ts_start,
		asset,
		account_id, strat_id, trigger_price, real_price, 
		(qty * real_price) AS volume,
		round(((real_price / trigger_price) - 1) * 100,4) AS price_del_pcnt,
		round((((qty * real_price)/(qty * trigger_price)) - 1), 4) AS volume_del_usdt,
		side,
		order_type
	FROM db_analytics.tbl_orders
	WHERE ts >= {ts_start} AND ts < {ts_finish} AND account_id != 100019
) o ALL LEFT JOIN (
	SELECT replace(symbol,'USDT','') AS asset,* 
	FROM db_analytics.tbl_volume_volatility_1m
	LIMIT 1 BY ts,asset
) v ON v.asset = o.asset AND v.ts = o.ts_start
ORDER BY ts