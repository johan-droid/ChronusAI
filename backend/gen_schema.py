import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent))

from app.db.session import Base
from app.models import *  # This will register all models with Base
from sqlalchemy.schema import CreateTable
from sqlalchemy import create_mock_engine

def dump(sql, *multiparams, **params):
    print(sql.compile(dialect=engine.dialect))

engine = create_mock_engine("postgresql://", dump)

def get_schema():
    print("-- Supabase/PostgreSQL Schema Migration")
    print("-- Generated for ChronosAI")
    print("\n")
    
    # Sort tables by dependency (approximate)
    for table in Base.metadata.sorted_tables:
        print(CreateTable(table).compile(dialect=engine.dialect))
        print(";")
        print("\n")

if __name__ == "__main__":
    get_schema()
