-- Cement Plant Operations - BigQuery Schema
-- Project: still-manifest-466507-k0
-- Dataset: cement_ops_dev

-- 1. Raw Telemetry Table (minute-resolution sensor data)
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.telemetry_raw` (
  timestamp TIMESTAMP NOT NULL,
  equipment_id STRING NOT NULL,
  mill_power_kw FLOAT64,
  mill_throughput_tph FLOAT64,
  separator_efficiency FLOAT64,
  kiln_temp_c FLOAT64,
  cooler_fan_rpm INT64,
  raw_caO FLOAT64,
  raw_siO2 FLOAT64,
  raw_al2O3 FLOAT64,
  raw_fe2O3 FLOAT64,
  raw_moisture FLOAT64,
  clinker_temp_c FLOAT64,
  fuel_mix JSON,
  energy_per_ton_kwh FLOAT64,
  thermal_substitution_rate FLOAT64,
  _ingest_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  _ingest_source STRING DEFAULT 'synthetic'
)
PARTITION BY DATE(timestamp)
CLUSTER BY equipment_id, DATE(timestamp)
OPTIONS(
  description="Raw minute-resolution telemetry from cement plant sensors",
  labels=[("env", "dev"), ("source", "iot")]
);

-- 2. Aggregated Telemetry (hourly/daily rollups for dashboards)
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.telemetry_agg` (
  agg_timestamp TIMESTAMP NOT NULL,
  equipment_id STRING NOT NULL,
  granularity STRING NOT NULL,  -- 'hourly' or 'daily'
  avg_mill_power_kw FLOAT64,
  avg_throughput_tph FLOAT64,
  avg_separator_efficiency FLOAT64,
  avg_kiln_temp_c FLOAT64,
  min_kiln_temp_c FLOAT64,
  max_kiln_temp_c FLOAT64,
  avg_energy_per_ton_kwh FLOAT64,
  total_production_tons FLOAT64,
  avg_thermal_substitution_rate FLOAT64,
  samples_count INT64,
  _computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(agg_timestamp)
CLUSTER BY equipment_id, granularity
OPTIONS(
  description="Aggregated telemetry metrics for dashboards and reporting"
);

-- 3. Lab Quality Results
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.lab_results` (
  timestamp TIMESTAMP NOT NULL,
  sample_id STRING NOT NULL,
  compressive_strength_3d_mpa FLOAT64,
  compressive_strength_7d_mpa FLOAT64,
  compressive_strength_28d_mpa FLOAT64,
  blaine_fineness_m2kg FLOAT64,
  setting_time_initial_min INT64,
  setting_time_final_min INT64,
  verified_by STRING,
  verification_method STRING,  -- 'manual' or 'ocr'
  certificate_image_uri STRING,
  _ingest_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
OPTIONS(
  description="Laboratory quality test results (manual entry and Cloud Vision OCR)"
);

-- 4. Image Analysis Results (Cloud Vision outputs)
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.image_analysis` (
  timestamp TIMESTAMP NOT NULL,
  image_id STRING NOT NULL,
  image_type STRING NOT NULL,  -- 'kiln_flame', 'lab_certificate', 'material_inspection'
  image_uri STRING,
  vision_labels JSON,  -- Cloud Vision label annotations
  extracted_text STRING,  -- OCR results
  flame_analysis JSON,  -- For kiln images: {"avg_temp_estimate": 1420, "soot_index": 0.3}
  confidence_score FLOAT64,
  processing_time_ms INT64,
  _processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY image_type
OPTIONS(
  description="Cloud Vision API analysis results for plant imagery"
);

-- 5. Optimization Logs (AI proposals, decisions, outcomes)
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.optimization_logs` (
  log_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  agent STRING NOT NULL,  -- 'optimization_agent', 'safety_gate', 'operator_assistant'
  proposal JSON,  -- Full proposal with action, expected deltas, rationale
  simulation_result JSON,  -- Vertex model predictions
  safety_decision STRING,  -- 'approved', 'rejected', 'escalated'
  safety_rejection_reason STRING,
  applied BOOL DEFAULT FALSE,
  operator_override BOOL DEFAULT FALSE,
  operator_override_reason STRING,
  outcome_actual JSON,  -- Measured results 1 hour after action
  outcome_measured_at TIMESTAMP,
  model_version STRING,
  _created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY agent, applied
OPTIONS(
  description="AI optimization proposals, safety gate decisions, and measured outcomes"
);

-- 6. Model Training Metadata
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.model_training_runs` (
  run_id STRING NOT NULL,
  model_name STRING NOT NULL,  -- 'energy_predictor_v1', 'quality_predictor_v1'
  training_start_time TIMESTAMP NOT NULL,
  training_end_time TIMESTAMP,
  vertex_job_id STRING,
  dataset_size_rows INT64,
  dataset_date_range STRUCT<start_date DATE, end_date DATE>,
  hyperparameters JSON,
  evaluation_metrics JSON,  -- {"mae": 2.3, "rmse": 3.1, "r2": 0.89}
  model_artifact_uri STRING,
  deployed_endpoint STRING,
  deployment_timestamp TIMESTAMP,
  status STRING,  -- 'training', 'completed', 'failed', 'deployed'
  _created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(training_start_time)
OPTIONS(
  description="Vertex AI model training run metadata and deployment history"
);

-- 7. System Alerts and Alarms
CREATE TABLE IF NOT EXISTS `still-manifest-466507-k0.cement_ops_dev.system_alerts` (
  alert_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  severity STRING NOT NULL,  -- 'info', 'warning', 'critical'
  alert_type STRING NOT NULL,  -- 'constraint_violation', 'model_drift', 'equipment_fault', 'quality_deviation'
  message STRING,
  details JSON,
  acknowledged BOOL DEFAULT FALSE,
  acknowledged_by STRING,
  acknowledged_at TIMESTAMP,
  resolved BOOL DEFAULT FALSE,
  resolved_at TIMESTAMP,
  _created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY severity, alert_type
OPTIONS(
  description="System alerts, alarms, and operator acknowledgments"
);

-- Create dataset if it doesn't exist
-- Note: Run this manually or via init_bigquery.py
-- bq mk --dataset --location=asia-south1 still-manifest-466507-k0:cement_ops_dev

-- Sample queries for common analytics

-- Query 1: Recent energy efficiency trend (hourly avg for last 24 hours)
-- SELECT 
--   TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
--   AVG(energy_per_ton_kwh) as avg_energy,
--   AVG(thermal_substitution_rate) as avg_thermal_sub
-- FROM `still-manifest-466507-k0.cement_ops_dev.telemetry_raw`
-- WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
-- GROUP BY hour
-- ORDER BY hour DESC;

-- Query 2: Optimization success rate (last 7 days)
-- SELECT 
--   DATE(timestamp) as date,
--   COUNT(*) as total_proposals,
--   COUNTIF(applied = TRUE) as applied_count,
--   COUNTIF(operator_override = TRUE) as override_count,
--   COUNTIF(safety_decision = 'rejected') as rejected_count,
--   ROUND(100 * COUNTIF(applied = TRUE) / COUNT(*), 1) as success_rate_pct
-- FROM `still-manifest-466507-k0.cement_ops_dev.optimization_logs`
-- WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
-- GROUP BY date
-- ORDER BY date DESC;

-- Query 3: Quality correlation with kiln temperature
-- SELECT 
--   ROUND(t.kiln_temp_c, -1) as kiln_temp_bucket,
--   AVG(l.compressive_strength_28d_mpa) as avg_strength,
--   COUNT(*) as sample_count
-- FROM `still-manifest-466507-k0.cement_ops_dev.telemetry_raw` t
-- JOIN `still-manifest-466507-k0.cement_ops_dev.lab_results` l
--   ON DATE(t.timestamp) = DATE(l.timestamp)
-- WHERE t.timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
-- GROUP BY kiln_temp_bucket
-- HAVING sample_count >= 5
-- ORDER BY kiln_temp_bucket;
