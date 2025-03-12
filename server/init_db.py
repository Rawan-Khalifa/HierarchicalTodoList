from flask_migrate import upgrade
from app import create_app

def init_db():
    """Initialize the database using migrations"""
    app = create_app()
    with app.app_context():
        # Use Flask-Migrate to create and upgrade the database
        # This is safer than db.drop_all() and db.create_all()
        upgrade()
        print("Database initialized successfully using migrations!")

if __name__ == "__main__":
    init_db()