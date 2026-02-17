import asyncpg
from config.settings import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def connect_db():
    """Connect to the database"""
    global db_pool
    try:
        logger.info(f"Connecting to database: {settings.db_host}:{settings.db_port}/{settings.db_name}")

        db_pool = await asyncpg.create_pool(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_username,
            password=settings.db_password,
            database=settings.db_name,
            min_size=1,
            max_size=10
        )

        logger.info(f"Successfully connected to database: {settings.db_name}")
        logger.info(f"Connection pool created with min_size=1, max_size=10")

    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}", exc_info=True)
        raise

async def disconnect_db():
    """Disconnect from the database"""
    global db_pool
    try:
        if db_pool:
            logger.info("Closing database connection pool")
            await db_pool.close()
            logger.info("Database connection pool closed successfully")
        else:
            logger.warning("No database connection pool to close")
    except Exception as e:
        logger.error(f"Error closing database connection: {str(e)}", exc_info=True)

async def get_db():
    """Get database connection"""
    if not db_pool:
        logger.error("Database pool not initialized")
        raise RuntimeError("Database pool not initialized")

    logger.debug("Returning database connection pool")
    return db_pool
