# test_db.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://clinical_admin:clinical_password@clinical-postgres-master:5432/clinical_storage"

async def test():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        await conn.execute("SELECT 1")
        print("✅ CONNECTION OK")

asyncio.run(test())
