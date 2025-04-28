from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

# Update the DATABASE_URL to use asyncpg
database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
metadata = MetaData()

# Update get_db to use AsyncSession
async def get_db():
    async with AsyncSession(bind=engine) as session:
        try:
            yield session
        finally:
            await session.close()