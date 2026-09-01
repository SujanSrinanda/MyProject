"""
SentinelFin Main Backend Entrypoint.
Delegates to modular backend.app.main:app architecture.
"""
from backend.app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
