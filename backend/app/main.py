import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings, validate_auth_environment
from backend.app.db.migrations import run_migrations
from backend.app.providers.neo4j_client import neo4j_client
from backend.app.api.api_router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate security settings
    validate_auth_environment()

    # 2. Run SQLite migrations
    try:
        run_migrations()
    except Exception as e:
        print(f"[Database Error] Migration error: {e}")

    # 3. Initialize Neo4j if configured
    if neo4j_client.is_configured():
        try:
            status_res = neo4j_client.verify_connection()
            if status_res.get("success"):
                print("[Neo4j] Connected to graph database successfully!")
                neo4j_client.init_constraints()
            else:
                print(f"[Neo4j] Connection notice: {status_res.get('message')}")
        except Exception as e:
            print(f"[Neo4j] Initial connection warning: {e}")

    yield

    # Clean up Neo4j driver
    if neo4j_client._driver:
        try:
            neo4j_client._driver.close()
        except Exception:
            pass

# Ensure SQLite schema and migrations are initialized
try:
    run_migrations()
except Exception as e:
    print(f"[Database Initialization Warning] {e}")

app = FastAPI(
    title="SentinelFin Security Core",
    description="Python FastAPI backend powering SentinelFin cybersecurity & anti-fraud transaction protection",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)

# Custom Exception Handlers for Exact SentinelFin JSON Error Contract
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail), "message": str(exc.detail), "detail": exc.detail},
        headers=headers,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_msg = errors[0]["msg"] if errors else "Invalid request data"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": first_msg, "message": first_msg, "details": errors},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Server Error] {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An internal server error occurred.", "message": str(exc)},
    )

# Mount API master router
app.include_router(api_router)

# Static files & SPA Frontend fallback
dist_path = os.path.abspath("dist")

@app.api_route("/assets/{file_path:path}", methods=["GET", "HEAD"])
async def serve_assets(file_path: str):
    asset_file = os.path.join(dist_path, "assets", file_path)
    if os.path.isfile(asset_file):
        return FileResponse(asset_file)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": f"Asset {file_path} not found"}
    )

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_spa(request: Request, full_path: str):
    # Prevent catching /api routes
    if full_path.startswith("api/") or full_path == "api":
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "API route not found"}
        )

    # Check for direct file in dist
    candidate = os.path.join(dist_path, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)

    # Fallback to index.html for client-side routing
    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "SentinelFin Python API running. Frontend static bundle not found yet."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
