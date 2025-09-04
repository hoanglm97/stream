#!/usr/bin/env python3
"""
Database initialization script for KidsStream
Creates initial categories and sample data
"""

from sqlalchemy.orm import sessionmaker
from database import engine
from models import Base, Category, User
from auth import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database with tables and sample data"""
    
    # Create all tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if categories already exist
        existing_categories = db.query(Category).count()
        if existing_categories > 0:
            logger.info("Categories already exist, skipping initialization")
            return
        
        # Create default categories
        categories = [
            {
                "name": "Educational",
                "description": "Learning videos for children including math, science, and language",
                "color": "#3B82F6"  # Blue
            },
            {
                "name": "Entertainment",
                "description": "Fun and engaging content for children's entertainment",
                "color": "#8B5CF6"  # Purple
            },
            {
                "name": "Stories",
                "description": "Storytelling and fairy tales for children",
                "color": "#10B981"  # Green
            },
            {
                "name": "Music",
                "description": "Songs, nursery rhymes, and musical content",
                "color": "#F59E0B"  # Yellow
            },
            {
                "name": "Arts & Crafts",
                "description": "Creative activities and DIY projects for kids",
                "color": "#EF4444"  # Red
            },
            {
                "name": "Nature & Animals",
                "description": "Educational content about wildlife and nature",
                "color": "#059669"  # Emerald
            },
            {
                "name": "Sports & Activities",
                "description": "Physical activities and sports for children",
                "color": "#DC2626"  # Red
            }
        ]
        
        logger.info("Creating default categories...")
        for cat_data in categories:
            category = Category(**cat_data)
            db.add(category)
        
        # Create a sample admin user
        logger.info("Creating sample admin user...")
        admin_user = User(
            email="admin@kidsstream.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_parent=True,
            is_active=True
        )
        db.add(admin_user)
        
        # Create a sample parent user
        parent_user = User(
            email="parent@example.com",
            username="parent_user",
            hashed_password=get_password_hash("parent123"),
            is_parent=True,
            is_active=True
        )
        db.add(parent_user)
        
        # Create a sample child user
        child_user = User(
            email="child@example.com",
            username="child_user",
            hashed_password=get_password_hash("child123"),
            is_parent=False,
            is_active=True
        )
        db.add(child_user)
        
        db.commit()
        logger.info("Database initialization completed successfully!")
        
        # Print sample credentials
        print("\n" + "="*50)
        print("SAMPLE USER CREDENTIALS")
        print("="*50)
        print("Admin User:")
        print("  Email: admin@kidsstream.com")
        print("  Password: admin123")
        print("  Type: Parent (can upload)")
        print()
        print("Parent User:")
        print("  Email: parent@example.com")
        print("  Password: parent123")
        print("  Type: Parent (can upload)")
        print()
        print("Child User:")
        print("  Email: child@example.com")
        print("  Password: child123")
        print("  Type: Child (view only)")
        print("="*50)
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()