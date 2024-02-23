CREATE TABLE IF NOT EXISTS db_analytics.tbl_volume_volatility_{tf} (
	ts UInt64,
	symbol String,
	volatility_tf Float64,
	volume_tf Float64,
	volatility_2_tf Float64,
	volume_diff_2_tf Float64,
	volatility_14_tf Float64,
	volume_diff_14_tf Float64
) ENGINE=MergeTree() ORDER BY ts	
