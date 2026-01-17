from sqlalchemy import create_engine, text

# DATABASE_URL = "sqlite:///./smart_grade.db"
# Use absolute path to be safe or relative to where I run it.
DATABASE_URL = "sqlite:///./smart_grade.db"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE courses ADD COLUMN is_visible BOOLEAN DEFAULT TRUE"))
            print("Successfully added is_visible column to courses table.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

if __name__ == "__main__":
    migrate()
