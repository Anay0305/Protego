"""
Database migration script to update existing database schema.
Run this on your VPS to migrate from old schema to new schema.
"""

from sqlalchemy import text
from database import engine, init_db

def migrate():
    """Migrate database to new schema."""
    print("🔄 Starting database migration...")

    with engine.begin() as conn:
        try:
            # Drop old columns if they exist
            print("Dropping old columns...")
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_number CASCADE"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS trusted_contacts CASCADE"))
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS updated_at CASCADE"))

            # Add new columns if they don't exist
            print("Adding new columns...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
            except Exception:
                print("  - password_hash column already exists")

            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN email SET NOT NULL"))
            except Exception:
                print("  - email already NOT NULL")

            print("✅ Migration completed successfully!")

        except Exception as e:
            print(f"❌ Migration error: {e}")
            raise

    # Create new tables
    print("Creating new tables...")
    init_db()
    print("✅ All tables created/updated!")

if __name__ == "__main__":
    migrate()
