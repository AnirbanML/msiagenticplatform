from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api import workflow_router
from config.settings import settings
from config.database import connect_db, disconnect_db
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MSI Agentic Platform - Python Services",
    description="Backend services for MSI Agentic Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    logger.info(f"Incoming request: {request.method} {request.url.path}")
    logger.debug(f"Request headers: {dict(request.headers)}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Time: {process_time:.3f}s"
        )

        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"- Error: {str(e)} - Time: {process_time:.3f}s",
            exc_info=True
        )
        raise

# Event handlers for database connection
@app.on_event("startup")
async def startup():
    logger.info("Application startup initiated")
    try:
        await connect_db()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}", exc_info=True)
        raise

@app.on_event("shutdown")
async def shutdown():
    logger.info("Application shutdown initiated")
    try:
        await disconnect_db()
        logger.info("Application shutdown completed successfully")
    except Exception as e:
        logger.error(f"Application shutdown failed: {str(e)}", exc_info=True)

# Include routers
app.include_router(workflow_router.router, prefix="/api/v1")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "MSI Agentic Platform - Python Services",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
