from flask import Flask
from flask_cors import CORS
from models import db
import config

# Define your create_app function
def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app)
    
    # Initialize the database with the Flask app
    db.init_app(app)
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.todos import todos_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(todos_bp, url_prefix='/api/todos')
    
    # Define the root route after creating the app
    @app.route('/')
    def home():
        return "Welcome to the Homepage!"
    
    # Define the favicon route
    @app.route('/favicon.ico')
    def favicon():
        return '', 204  # Return a no-content response to avoid 404 errors

    return app

# Start the app when this script is executed directly
if __name__ == '__main__':
    app = create_app()  # Create the app using the function
    app.run(debug=True)
