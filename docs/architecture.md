# SentinelFin Architecture & Integration Guide

SentinelFin is a Zero-Trust AI-assisted financial fraud and suspicious transaction detection platform.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, HTML5, CSS3, PWA (Progressive Web App support).
- **Backend**: Python 3.12+, FastAPI, Uvicorn, Pydantic v2.
- **Relational Database**: SQLite 3 with automatic schema migrations.
- **Graph Database**: Neo4j (AuraDB or self-hosted) for relationship analysis & mule cluster detection.
- **Machine Learning**: Scikit-Learn (Random Forest, Isolation Forest), Pandas, NumPy, SHAP explainability factors.
- **AI Explanation**: Google Gemini API integration for natural language risk breakdowns.
- **Authentication**: PBKDF2 (210,000 hash iterations), HMAC-SHA256 session tokens, OTP via SMS/Email.

## Directory Structure

```
SentinelFin/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes (auth, users, transactions, budgets, etc.)
│   │   ├── core/         # Security, hashing, config
│   │   ├── db/           # SQLite migrations & database manager
│   │   ├── ml/           # Scikit-Learn ML risk models (RandomForest, IsolationForest)
│   │   ├── middleware/   # Bearer token auth middleware
│   │   ├── providers/    # Neo4j client, Gemini AI, Twilio SMS
│   │   ├── repositories/ # Data access abstraction layers
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── services/     # Core business logic
│   └── tests/            # Pytest suite
├── database/
│   └── schema.sql        # Core relational schema
├── docs/                 # Documentation
├── public/               # Static PWA manifest & service worker
├── src/                  # React + TypeScript frontend
│   ├── components/       # Pages, layout, and UI components
│   ├── context/          # Auth & Transaction state contexts
│   └── services/         # API service layer calling FastAPI backend
├── package.json
└── vite.config.ts
```

## Running the Application

1. **Start Backend (FastAPI)**:
   ```bash
   npm run backend
   # or: python -m uvicorn backend.app.main:app --port 8081 --reload
   ```

2. **Start Frontend (Vite)**:
   ```bash
   npm run dev
   ```
