from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decouple import config
import os

# Database configuration
DATABASE_URL = config(
    "DATABASE_URL", 
    default="postgresql://kidsstream:kidsstream123@localhost:5432/kidsstream_db"
)

# For development, you can also use SQLite
# DATABASE_URL = "sqlite:///./kidsstream.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()