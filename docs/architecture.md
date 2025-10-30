# Cement Plant GenAI Operations Platform - Architecture

## Overview
Enterprise-grade autonomous cement manufacturing optimization platform leveraging Google Cloud AI services for real-time process control, predictive analytics, and operator assistance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EDGE LAYER (Plant Floor)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  PLCs/SCADA  │  Kiln Cameras  │  Lab Instruments  │  Material Sensors  │
│  (MQTT/OPC)  │   (Images)     │   (Certificates)  │   (Chemistry)      │
└──────┬────────────────┬────────────────┬────────────────┬───────────────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER (Cloud Run)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Data Ingest Agent: Pub/Sub → GCS Raw Storage + BigQuery TimeSeries    │
│  Vision Agent: Cloud Vision API → OCR + Flame Analysis → BigQuery      │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (BigQuery + GCS)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  • telemetry_raw: Minute-resolution sensor data                         │
│  • telemetry_agg: Hourly/daily aggregations                            │
│  • lab_results: Quality test results                                    │
│  • image_analysis: Vision API outputs (kiln flame, docs)               │
│  • optimization_logs: AI proposals + actions + outcomes                 │
│  • GCS Buckets: Raw images, model artifacts, backups                   │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI/ML LAYER (Vertex AI)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Training Pipelines:                                                     │
│    • Energy Prediction Model (kWh/ton)                                  │
│    • Quality Prediction Model (strength, fineness)                      │
│    • Fuel Mix Optimizer (thermal substitution)                          │
│  Deployed Endpoints:                                                     │
│    • vertex:energy_predictor_v1                                         │
│    • vertex:quality_predictor_v1                                        │
│  Gemini Integration:                                                     │
│    • Decision proposal generation                                       │
│    • Natural language explanations                                      │
│    • Operator chat assistant                                            │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATION (Agent Builder)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Feature Store Agent: Create training features from BigQuery         │
│  2. Optimization Agent: Propose parameter adjustments                   │
│  3. Simulation Agent: Predict outcomes using Vertex models              │
│  4. Safety Gate Agent: Validate constraints + escalate                  │
│  5. Operator Assistant: Gemini-powered chat + KPI queries               │
│                                                                          │
│  Orchestration Loop (every 5 minutes):                                  │
│    Observe → Propose → Simulate → Safety Check → Apply/Log → Monitor   │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Firebase + React)                │
├─────────────────────────────────────────────────────────────────────────┤
│  Firebase:                                                               │
│    • Authentication (operator roles)                                    │
│    • Firestore: Real-time proposals, alarms, operator logs             │
│    • Realtime Database: Live telemetry feed                            │
│  Frontend (React + Tailwind):                                           │
│    • Dashboard: Live KPIs, charts, system health                       │
│    • Proposals: AI suggestions with accept/reject controls             │
│    • Chat Assistant: Natural language operator interface               │
│    • Alerts: Safety violations, model drift, anomalies                 │
└──────┬──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY LAYER (Cloud Monitoring)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Metrics: Energy kWh/ton, thermal sub %, quality variance, model drift │
│  Logs: Cloud Logging (agent decisions, API calls, errors)              │
│  Alerts: PagerDuty/Slack for safety violations, system failures        │
│  Dashboards: Custom Cloud Monitoring for SRE/ops teams                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Data Ingestion Agent
- **Technology**: Cloud Run (Python FastAPI)
- **Inputs**: MQTT/OPC UA from plant floor
- **Outputs**: BigQuery inserts, GCS object writes
- **Features**: 
  - Real-time stream processing (Pub/Sub)
  - Data validation and quality checks
  - Automatic schema evolution
  - Dead letter queue for failed records

### 2. Cloud Vision Integration
- **Use Cases**:
  - Kiln flame analysis (temperature estimation, soot detection)
  - Lab certificate OCR (auto-populate quality results)
  - Material inspection (raw feed quality, clinker consistency)
- **Pipeline**: Image → Cloud Vision API → Structured JSON → BigQuery
- **Models**: Pre-trained Vision API + custom AutoML models

### 3. Vertex AI Models
**Energy Predictor** (`energy_predictor_v1`):
- Input: Mill power, throughput, raw moisture, separator efficiency
- Output: kWh per ton of cement
- Algorithm: XGBoost with SHAP explainability

**Quality Predictor** (`quality_predictor_v1`):
- Input: Raw chemistry, burn zone temp, cooling rate, grind fineness
- Output: Compressive strength (MPa), Blaine fineness
- Algorithm: Neural network (TensorFlow)

**Fuel Mix Optimizer** (`fuel_optimizer_v1`):
- Input: Fuel properties, kiln conditions, cost constraints
- Output: Optimal fuel blend ratios
- Algorithm: Multi-objective optimization (Pyomo)

### 4. Gemini Prompts
**Decision Proposal Template**:
```
You are an expert cement plant optimization AI. Given current telemetry and constraints, propose 3-5 actionable adjustments to reduce energy consumption while maintaining quality.

Current State:
- Mill power: {mill_power_kw} kW
- Throughput: {throughput_tph} TPH
- Raw CaO: {raw_caO}%
- Kiln temp: {kiln_temp_c}°C
- Fuel mix: {fuel_mix}

Constraints:
- Kiln temp range: {min_kiln_temp_c}-{max_kiln_temp_c}°C
- Max fuel substitution change: {max_fuel_sub_change_per_hour_pct}% per hour

Output format (JSON):
{
  "proposals": [
    {
      "action": "Reduce mill power to X kW",
      "expected_energy_delta_kwh_ton": -Y,
      "expected_quality_impact": "negligible/minor/moderate",
      "confidence": 0.XX,
      "rationale": "<120 words explaining why this helps>",
      "risk_level": "low/medium/high"
    }
  ]
}
```

**Explanation Template**:
```
Translate this technical optimization into plain language for plant operators. Focus on safety, clarity, and actionable steps.

Technical proposal: {json_proposal}

Explain in <100 words:
- What we're changing and why
- Expected benefits
- Any risks to watch for
- What the operator should monitor
```

### 5. Agent Builder Configuration
**Agents** (YAML manifests in `/agents/`):
1. `data_ingest_agent.yaml`: Pub/Sub triggers, BigQuery writes
2. `feature_store_agent.yaml`: SQL feature engineering, Vertex feature store sync
3. `optimization_agent.yaml`: Model inference, proposal generation
4. `safety_gate_agent.yaml`: Constraint validation, escalation rules
5. `operator_assistant.yaml`: Gemini chat integration, KPI queries

**Orchestration**:
- Cron trigger: Every 5 minutes
- Event-driven: On alarm, operator override, or model drift
- State management: Firestore for agent communication

### 6. Safety Constraints
Implemented in Safety Gate Agent:
- Kiln temperature: 1350-1450°C (hard limits)
- Fuel substitution rate: Max 5% change per hour
- Mill vibration: <4.5 mm/s
- Separator efficiency: >80%
- Emergency stop: Operator can always override AI

**Escalation Logic**:
- Critical violations → Immediate alarm + revert last action
- Repeated constraint violations → Reduce automation confidence
- Model uncertainty >30% → Require operator approval

### 7. Data Schemas (BigQuery)

**telemetry_raw**:
```sql
CREATE TABLE telemetry_raw (
  timestamp TIMESTAMP NOT NULL,
  equipment_id STRING,
  mill_power_kw FLOAT64,
  mill_throughput_tph FLOAT64,
  separator_efficiency FLOAT64,
  kiln_temp_c FLOAT64,
  cooler_fan_rpm INT64,
  raw_caO FLOAT64,
  raw_siO2 FLOAT64,
  raw_al2O3 FLOAT64,
  raw_fe2O3 FLOAT64,
  fuel_mix JSON,  -- [{"fuel":"coal","%":55}, ...]
  _ingest_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY equipment_id;
```

**optimization_logs**:
```sql
CREATE TABLE optimization_logs (
  log_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  agent STRING,
  proposal JSON,
  simulation_result JSON,
  safety_decision STRING,  -- approved/rejected/escalated
  applied BOOL,
  operator_override BOOL,
  outcome_actual JSON,  -- measured results after 1 hour
  _created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp);
```

## Security & Compliance

### IAM Roles
- **Data Ingest Service Account**: `roles/pubsub.subscriber`, `roles/bigquery.dataEditor`
- **Vertex AI Service Account**: `roles/aiplatform.user`, `roles/storage.objectViewer`
- **Agent Builder Service Account**: `roles/aiplatform.user`, `roles/firebasedatabase.admin`
- **Frontend**: Firebase Auth token verification, read-only BigQuery access

### Data Retention
- Telemetry raw: 90 days (then archive to GCS nearline)
- Aggregated data: 7 years (regulatory compliance)
- Model artifacts: Indefinite (with versioning)
- Logs: 30 days in Cloud Logging, then export to BigQuery

### Encryption
- At-rest: Default GCP encryption (AES-256)
- In-transit: TLS 1.3 for all API calls
- Secrets: Google Secret Manager (API keys, service account keys)

## Cost Optimization (Prototype)

**Estimated Monthly Costs** (dev environment):
- BigQuery: ~$50 (1GB data scanned/day)
- Vertex AI: ~$100 (10 training runs, 2 endpoints)
- Cloud Run: ~$20 (minimal traffic)
- Cloud Vision: ~$30 (500 images/day)
- Gemini: ~$50 (1000 chat requests/day)
- Firebase: Free tier
- **Total**: ~$250/month

**Production Scaling**:
- Use BigQuery BI Engine for cached dashboards
- Batch predict instead of online endpoints where latency allows
- Preemptible VMs for training
- Set budget alerts at $500, $1000, $2000

## Monitoring Metrics

**Key Performance Indicators**:
1. Energy efficiency: kWh per ton of cement (target: <95 kWh)
2. Thermal substitution rate: % alternative fuels (target: >30%)
3. Quality variance: Std dev of compressive strength (target: <2 MPa)
4. Model accuracy: MAE on energy prediction (target: <3 kWh)
5. Uptime: % time AI optimization is active (target: >95%)

**Alerts**:
- Energy >100 kWh/ton for 30 min
- Quality variance >3 MPa
- Model drift: Prediction error doubles from baseline
- Safety violations: Any constraint breach
- System health: API latency >2s, error rate >1%

## Deployment Strategy

**Environments**:
- **Dev**: Synthetic data, mock models, local Firebase emulator
- **Staging**: Real data mirror, shadow mode (no actions applied)
- **Production**: Full automation with operator override

**Rollout Plan**:
1. Week 1-2: Deploy infra, ingest synthetic data
2. Week 3-4: Train initial models, validate accuracy
3. Week 5-6: Run in shadow mode (log proposals, don't apply)
4. Week 7-8: Enable automation for grinding optimization only
5. Week 9+: Gradual rollout to kiln, cooler, fuel mix

## Disaster Recovery

**Backup**:
- BigQuery: Automated snapshots daily
- Firestore: Export to GCS weekly
- Model artifacts: Versioned in GCS with lifecycle policy

**Failover**:
- Vertex endpoint failures → Fallback to last known good model
- BigQuery outage → Use cached Firestore data for dashboards
- Complete GCP outage → Manual plant operations (SOP documented)

**RTO/RPO**:
- Recovery Time Objective: 15 minutes (dashboard/monitoring)
- Recovery Point Objective: 5 minutes (telemetry data loss acceptable)
