# Cement Plant AI Platform - Demo Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Google Cloud SDK (`gcloud` CLI)
- Docker (optional, for containerized services)

### 1. Clone and Install Dependencies

```bash
# Frontend
npm install

# Backend (Python services)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Data generator
cd data
pip install -r requirements.txt
cd ..
```

### 2. Configure Google Cloud Credentials

The platform uses the following real GCP credentials (already configured):

```bash
# Set environment variables
export GCP_PROJECT="GoogleWalletUsecase"
export GCP_PROJECT_ID="still-manifest-466507-k0"
export GCP_REGION="asia-south1"
export GCS_BUCKET="cement-operations"
export BIGQUERY_DATASET="cement_ops_dev"

# Gemini API
export GEMINI_API_KEY="AIzaSyDm8ezHj4OljpCmv3Jt6-CGeKv2lZB8gXs"

# Vertex AI API (if needed separately)
export VERTEX_API_KEY="AQ.Ab8RN6Juytjmo2mnypnfNk5wJraQH_9-k_oWpBqLiLplv2gvtg"

# Service account authentication
export GOOGLE_APPLICATION_CREDENTIALS="./secrets/service-account.json"
```

**Service Account Setup**:
Create `secrets/service-account.json` with:
```json
{
  "type": "service_account",
  "project_id": "still-manifest-466507-k0",
  "private_key_id": "9d6868c7269ec2f0318d5bece660010fff9790cb",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5Kq4juRatYxYE\nXDc6PpuIKx+W5u8xZR5tbdYOmdA1ZwnhQVRJ5FvWFC9ORhWiYKAIdPiSdfjMg5zp\nKm1HD1gW7E0Vpwv4U+OdxhHHwZ+A2szUsP5elfRQuL9FsOwLaVe7H/nycHaJqa15\nJj2ucs0sZ/MSIoyLNw9eH8NTxTtzDcx2T+SLP8pVAj9tYEAlPn6KJYLa5HEVrMv4\nFsckw04oLYxMjmUQlwRqJ7SztFuIQMgobBdd/GX6iiL+JPO73G7nd0TNI7nqd79f\nMHQJVrA5AK5A3jpPct86/Ja2Py6SDZNIY9tPNjvFt2uoGMZ3PMKhUoAKHYnEhQCU\n/J/hVVUVAgMBAAECggEAUdakx6Im/TQlh4DQYfxI1pqkqBfiUPUNyTS53pMp3Ghx\ni+7JV61Hz6r1K4W7SxykrogwUt80OwPShpVbXgRQnTUMbsz5c+Rz3ggsVJrlqdhK\nnpipnFlvdXvqAd3LvdFt1oUv/fCp23c0di6qJV+VAhLhcjr13hPURXgJZw1tlJAb\ntbHS7e5BVDH3sgUw8tngXlO1vs5Q4yEuqQ7GNa3FAIZJ6jYNVKZnw5OBcxLisK2+\nWqWpy48jpzz6RA8Ltwen5563NQ33Pl89eerg/NFYwYHThXxr9Qa+RIGMxDcPoRrY\nG02sSg6xcDVDni5YvaHKNcd9okEJAg5YyPRv8zwgAwKBgQDxmWmmKulR2xyGZK5u\nDYge6vl9t563xyVkUvhNcNk2vDfTHYldghTKSnU7O3SNtMLE5ytZkheyjAjQ+lGt\nUq4eKK4T1HcLDa9VA+H1M3k1LfDhd8m3VARnTEK816I2EGqVZ3kjGygt/nYWD0sa\navVmufOQch7u+JNvkbcrOyHe5wKBgQDENChcQpZMDUiHgD1hBIEb2FGD27tYEOeX\nfgq98lRK/UuhV8gAh1I8ptRPmTiiTEUXNBV/QG3AXyk7If3MEZwYEqrQ9xLE8iPp\nyZS0xuq++D/Euy/n5WM0xiW/o+KxA3bVrn0WJVk0SEtKwefCJvlVTjfRukWJdbzy\nIKkTPRNYowKBgEiZ32Ot1XthqsrACqLLsjIITnz25t03HQdu32r2FHAcU3I/l/3f\njzvS8DOihD3pKfZduWsrOa/P4P5bmpvJEsXBV75hxHwv2pZjmk1C8JOIgLBgfN94\ngfJAunVhHz+74yuOcpqYGJTpuLacVedUaPY7vvOTN7R8QmHumeqF1IHVAoGAB4Cf\nEngRWzMe1N+YeT882J268DnUvhdXY7mUG5NKmdt5qt+6bBrAkEUo1SpcuggElFCP\nieAi0jpRT0uLcuQxfdIo6fiopRNFQElPAGKi006W0aT+vfVNh9UT2HIh1vb08lLL\nwa8H7DHffypO/GOVISfuhnyC8DCqWu/Yxz2ModUCgYB1P0R8DPMJlS4ltK8KAYY5\nz8uZD3fwr1pT5VLUYxcQdEAgDvnozQIIlwQmVTXA8qdiW4iUUwF9vZuYAcpbUxp2\ny6kCdAOlUgX1g+GlnpOJ0K0et9r6BJ/PyhU/BTUYePo86thsnmtvVp21DuLbrRgH\nExl6b1c7caJOGnD4BRYfzw==\n-----END PRIVATE KEY-----\n",
  "client_email": "still-manifest-466507-k0@appspot.gserviceaccount.com",
  "client_id": "111915492450401371624",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/still-manifest-466507-k0%40appspot.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

**Firebase Configuration**:
Create `secrets/firebase-config.json`:
```json
{
  "apiKey": "AIzaSyBnocwqAAVoPWWSmOa6PA7LCD3-SQGGslM",
  "authDomain": "still-manifest-466507-k0.firebaseapp.com",
  "projectId": "still-manifest-466507-k0",
  "storageBucket": "still-manifest-466507-k0.firebasestorage.app",
  "messagingSenderId": "340230390866",
  "appId": "1:340230390866:web:c3bc4ecf26941879968b8b"
}
```

### 3. Initialize BigQuery Tables

```bash
# Run schema creation script
cd infra
python init_bigquery.py

# This creates:
# - cement_ops_dev.telemetry_raw
# - cement_ops_dev.telemetry_agg
# - cement_ops_dev.lab_results
# - cement_ops_dev.image_analysis
# - cement_ops_dev.optimization_logs
```

### 4. Generate Synthetic Telemetry Data

```bash
cd data
python generate_synthetic_data.py \
  --hours 48 \
  --interval_seconds 60 \
  --output synthetic_telemetry.csv \
  --introduce_faults true

# Load into BigQuery
bq load \
  --source_format=CSV \
  --skip_leading_rows=1 \
  --autodetect \
  cement_ops_dev.telemetry_raw \
  synthetic_telemetry.csv
```

**Data Generation Options**:
- `--hours`: Duration of synthetic data (default: 48)
- `--interval_seconds`: Sample frequency (default: 60)
- `--variability`: 'low', 'medium', 'high' for realistic noise
- `--introduce_faults`: Simulate equipment issues (fuel quality drop, raw feed variability spike)

### 5. Start Backend Services

```bash
# Terminal 1: API Server (FastAPI)
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: AI Pipeline Worker (optional for full demo)
python ai_pipeline/train_model.py --model energy_predictor

# Terminal 3: Agent Orchestrator (simulated)
python agents/orchestrator.py --interval 300
```

### 6. Start Frontend Dashboard

```bash
# Terminal 4: React dev server
npm run dev

# Open browser to http://localhost:8080
```

## End-to-End Demo Flow

### Scenario: High Energy Consumption Alert

1. **Observe Telemetry** (Dashboard)
   - Navigate to dashboard (http://localhost:8080)
   - View live metrics: Energy = 102 kWh/ton (above target of 95)
   - Kiln temp = 1430°C, Mill power = 1300 kW

2. **AI Proposes Optimization** (Agent Builder)
   ```bash
   # Trigger optimization manually
   curl -X POST http://localhost:8000/api/optimize \
     -H "Content-Type: application/json" \
     -d '{
       "timestamp": "2025-10-30T14:00:00+05:30",
       "mill_power_kw": 1300,
       "throughput_tph": 85,
       "kiln_temp_c": 1430
     }'
   ```

   **Expected Response**:
   ```json
   {
     "proposals": [
       {
         "action": "Reduce mill power to 1250 kW",
         "expected_energy_delta_kwh_ton": -4.2,
         "expected_quality_impact": "negligible",
         "confidence": 0.87,
         "rationale": "Current separator efficiency is 88%, allowing 50kW reduction without throughput loss. Raw moisture is low (1.8%), supporting grinding efficiency.",
         "risk_level": "low"
       }
     ],
     "safety_gate_decision": "approved",
     "simulation_id": "sim_20251030_140523"
   }
   ```

3. **Safety Gate Validation**
   - Check logs in backend terminal
   - Should see: `[SafetyGate] Proposal approved: All constraints satisfied`
   - Constraints checked:
     - Mill power reduction <10% ✓
     - Kiln temp within 1350-1450°C ✓
     - No emergency stops active ✓

4. **Operator Review** (Frontend)
   - Proposal card appears in dashboard "Pending Actions" section
   - Click "View Details" to see:
     - Energy savings: -4.2 kWh/ton
     - Quality impact: Negligible
     - Gemini explanation in plain English
   - Click "Approve" or "Reject"

5. **Action Applied** (Simulated)
   - If approved, backend logs action to `optimization_logs` table
   - Dashboard shows: "Optimization in progress..."
   - After 60 minutes, compare actual vs predicted outcomes

6. **Outcome Analysis** (BigQuery)
   ```sql
   SELECT 
     proposal->>'action' as action,
     proposal->>'expected_energy_delta_kwh_ton' as predicted_savings,
     outcome_actual->>'energy_delta_kwh_ton' as actual_savings,
     TIMESTAMP_DIFF(
       TIMESTAMP(outcome_actual->>'measured_at'),
       timestamp,
       MINUTE
     ) as minutes_elapsed
   FROM cement_ops_dev.optimization_logs
   WHERE log_id = 'sim_20251030_140523';
   ```

## Testing Scenarios

### Scenario 1: Normal Operations
- Synthetic data with low variability
- Energy stays 92-96 kWh/ton
- Quality variance <1.5 MPa
- Expected: AI proposes minor tweaks, all approved by safety gate

### Scenario 2: Raw Material Variability Spike
```bash
python data/generate_synthetic_data.py \
  --hours 24 \
  --fault_type raw_variability_spike \
  --fault_start_hour 8
```
- CaO content suddenly drops from 62% to 58%
- Expected: AI proposes increased kiln temp, higher grinding power
- Safety gate: May escalate if temp approaches 1450°C limit

### Scenario 3: Fuel Quality Drop
```bash
python data/generate_synthetic_data.py \
  --hours 24 \
  --fault_type fuel_quality_drop \
  --fault_start_hour 12
```
- Biomass calorific value decreases 15%
- Expected: AI proposes reduced alternative fuel %, compensate with coal
- Safety gate: Enforces max 5% fuel mix change per hour

### Scenario 4: Operator Override
- Frontend: Manually reject an AI proposal
- Expected: Action logged with `operator_override=true`
- Dashboard shows override reason textbox

## Monitoring & Debugging

### View BigQuery Data
```bash
# Recent telemetry
bq query --use_legacy_sql=false \
  'SELECT * FROM cement_ops_dev.telemetry_raw 
   ORDER BY timestamp DESC LIMIT 100'

# Optimization history
bq query --use_legacy_sql=false \
  'SELECT 
     timestamp,
     proposal->>"action" as action,
     safety_decision,
     applied
   FROM cement_ops_dev.optimization_logs
   ORDER BY timestamp DESC LIMIT 20'
```

### Backend Logs
```bash
# API server logs
tail -f backend/logs/api.log

# Agent orchestrator logs
tail -f backend/logs/agents.log
```

### Frontend DevTools
- Open browser DevTools (F12)
- Network tab: Monitor API calls to `/api/telemetry`, `/api/proposals`
- Console: Check for React errors or Firebase connection issues

## Switching to Production

### 1. Use Real Telemetry Sources
Replace synthetic data generator with actual plant integrations:

```python
# backend/ingest/mqtt_client.py
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("plant-mqtt-broker.local", 1883)
client.subscribe("cement/telemetry/#")

def on_message(client, userdata, msg):
    data = json.loads(msg.payload)
    insert_to_bigquery(data)  # Replace CSV upload
```

### 2. Deploy to Cloud Run
```bash
# Build and deploy API
cd backend
gcloud run deploy cement-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=still-manifest-466507-k0,BIGQUERY_DATASET=cement_ops_prod

# Deploy frontend to Firebase Hosting
npm run build
firebase deploy --only hosting
```

### 3. Enable Vertex AI Training
```bash
# Submit training job
cd ai_pipeline
gcloud ai custom-jobs create \
  --region=asia-south1 \
  --display-name=energy-predictor-training \
  --worker-pool-spec=machine-type=n1-standard-4,replica-count=1,container-image-uri=gcr.io/still-manifest-466507-k0/trainer:latest
```

### 4. Configure Monitoring Alerts
```bash
# Create alert policy for high energy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Energy Alert" \
  --condition-threshold-value=100 \
  --condition-threshold-duration=1800s \
  --condition-display-name="Energy > 100 kWh/ton"
```

## Troubleshooting

### Issue: BigQuery Permission Denied
**Solution**: Ensure service account has `roles/bigquery.dataEditor`
```bash
gcloud projects add-iam-policy-binding still-manifest-466507-k0 \
  --member=serviceAccount:still-manifest-466507-k0@appspot.gserviceaccount.com \
  --role=roles/bigquery.dataEditor
```

### Issue: Gemini API Rate Limit
**Solution**: Add exponential backoff in backend
```python
import time
from google.api_core import retry

@retry.Retry(predicate=retry.if_exception_type(Exception))
def call_gemini_api(prompt):
    # API call here
    pass
```

### Issue: Frontend Can't Connect to Backend
**Solution**: Check CORS settings in backend/main.py
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Demo Checklist

- [ ] BigQuery tables created and populated
- [ ] Synthetic data generated (48 hours)
- [ ] Backend API running on port 8000
- [ ] Frontend dashboard accessible at localhost:8080
- [ ] Can view live telemetry on dashboard
- [ ] Can trigger optimization and see proposals
- [ ] Safety gate validates constraints
- [ ] Operator can approve/reject actions
- [ ] Outcomes logged to BigQuery
- [ ] Chat assistant responds to queries

## Next Steps

1. **Enhance Models**: Train on more data, add cross-validation
2. **Real Integrations**: Connect to actual plant systems (OPC UA, MQTT)
3. **Advanced Analytics**: Add anomaly detection, predictive maintenance
4. **Multi-Plant**: Scale architecture for multiple cement plants
5. **Mobile App**: Build operator mobile interface for alerts

## Support

- Documentation: `/docs` folder
- Issues: File in project issue tracker
- Contact: platform-support@example.com
