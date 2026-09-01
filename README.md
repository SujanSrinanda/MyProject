# SentinelFin - Personal Financial Safety & Security Platform

SentinelFin is a comprehensive personal financial safety and threat-detection platform designed to secure digital payments, detect fraud, monitor real-time transaction anomalies, and visualize financial network relationships.

---

## 🏗️ Architecture Overview

The platform uses a strict full-stack separation of concerns:

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons, Recharts.
- **Backend**: Python 3.10+, FastAPI REST API with structured routers and dependency injection.
- **Application Database**: SQLite (`sentinelfin.db`) with automatic table migrations, indexing, and PBKDF2 (210,000 rounds) credential hashing.
- **Relationship Graph**: Neo4j AuraDB / Cypher graph database for account relationships, syndicate detection, and money-mule link analysis.
- **AI Threat Intelligence**: Server-side Google Gemini GenAI engine (`gemini-2.5-flash`) for behavioral risk assessments.

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, transactions, users, budgets, contacts, alerts, devices, neo4j)
│   │   ├── core/            # Config, security (PBKDF2, HMAC sessions), compatibility layers
│   │   ├── db/              # SQLite database manager & migration engine
│   │   ├── middleware/      # Bearer token session authentication
│   │   ├── models/          # Domain data models & types
│   │   ├── providers/       # Gemini AI provider & Neo4j graph client
│   │   ├── repositories/    # Clean data access layer (users, sessions, OTPs, txs, budgets, etc.)
│   │   ├── schemas/         # Pydantic request/response validation schemas
│   │   ├── services/        # Authoritative business logic & transaction risk guardrails
│   │   └── main.py          # FastAPI application entry point
│   ├── requirements.txt     # Python backend dependencies
│   └── tests/
│       └── test_backend.py  # End-to-end backend test suite (14 test checkpoints)
├── src/
│   ├── components/          # Reusable UI components and modal workflows
│   ├── context/             # AuthContext, TransactionContext, ThemeContext
│   ├── services/
│   │   └── api.ts           # Pure API client proxying to backend endpoints
│   ├── types.ts             # TypeScript type definitions
│   └── App.tsx              # Main application root
├── metadata.json
├── package.json
└── vite.config.ts
```

---

## 🚀 Running the Application

### 1. Frontend Development Server
```bash
npm install
npm run dev
```

### 2. Backend FastAPI Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Running Backend Tests
```bash
python3 backend/tests/test_backend.py
```

---

## 🔑 Built-in Demo Credentials

For instant demonstration and evaluation:
- **Demo Account 1**: `demo@sentinelfin.com` / `password123`
- **Demo Account 2 (Email)**: `suj@gmail.com` / `password123`
- **Demo Account 2 (Phone)**: `9113093314` / `password123`
