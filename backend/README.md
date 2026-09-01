# SentinelFin FastAPI Backend

Production-grade Autonomous Zero-Trust Fraud Detection & Graph Intelligence API built exclusively with **FastAPI** (Python 3.10+).

## Features

- 🛡️ **Zero-Trust Risk Engine**: Real-time fraud probability evaluation, anomaly detection, behavioral baselining, and mule cluster proximity indexing.
- 🕸️ **Neo4j Graph Integration**: Cypher transaction logging, graph subnetwork visualizer, threat cluster isolation.
- 🔐 **Zero-Trust Auth & Verification**: Session tokens, 6-digit OTP verification for phone and email, device fingerprinting, and security preference controls.
- 💸 **UPI Real-Time Transactions**: Instant rule-based and AI ML risk scoring, category budget tracking, and real-time transaction ledger.
- ⚡ **Interactive OpenAPI & Swagger Docs**: Available at `/docs` and ReDoc at `/redoc`.

---

## Directory Structure

```
backend/
├── main.py              # FastAPI application entry point with all endpoints
├── requirements.txt     # Python dependencies
└── README.md            # Backend documentation
```

---

## Installation & Running Standalone

1. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Start the FastAPI development server:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

3. Open Swagger UI in your browser:
```
http://localhost:8000/docs
```
or ReDoc at:
```
http://localhost:8000/redoc
```

---

## API Endpoints Summary

### Health & System
- `GET /api/health` — System status and active memory statistics

### Authentication & Users
- `POST /api/auth/signup` — Register new user account
- `POST /api/auth/login` — Authenticate via email or phone
- `POST /api/auth/send-otp` — Generate and dispatch 6-digit OTP
- `POST /api/auth/verify-otp` — Verify OTP for email/phone verification
- `GET /api/auth/me` — Retrieve active user session and security profile
- `POST /api/auth/onboarding` — Save onboarding survey and custom limits

### Transactions & Risk Engine
- `GET /api/transactions` — List user transactions
- `POST /api/transactions` — Process new transaction
- `POST /api/transactions/evaluate-risk` — Run Zero-Trust multi-factor risk engine

### Contacts, Alerts & Devices
- `GET /api/contacts` / `POST /api/contacts` / `DELETE /api/contacts/{id}`
- `GET /api/alerts` / `POST /api/alerts` / `DELETE /api/alerts`
- `GET /api/devices` / `POST /api/devices/register` / `DELETE /api/devices/{id}`

### Neo4j Graph
- `GET /api/graph/status` — Neo4j cluster connection status
- `GET /api/graph/data` — Subnetwork graph nodes and links
- `GET /api/graph/cypher-logs` — Cypher execution audit logs
