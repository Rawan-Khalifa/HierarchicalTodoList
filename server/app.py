from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate  # Added import
from models import db, User
import config
from flask import Flask, jsonify, request

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False  # or True if you have HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    CORS(app, supports_credentials=True, origins="http://localhost:3000")
    db.init_app(app)
    
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)  # Added Flask-Migrate initialization

    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    # Disable default login_view redirect
    login_manager.login_view = None
    login_manager.login_message = None

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        """
        Instead of redirecting to /login on unauthorized,
        return a 401 JSON response.
        """
        return jsonify({"error": "Unauthorized"}), 401

    # Add a global before_request handler for CORS preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            headers = {
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': 'true'
            }
            return jsonify(headers), 200
    
    # Register your blueprints (auth, todos, etc.)
    from routes.auth import auth_bp
    from routes.todos import todos_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(todos_bp, url_prefix='/api/todos')

    return app

if __name__ == '__main__':
    app = create_app()
    # with app.app_context():
    #    db.create_all()  # This will be replaced by migrations
    app.run(debug=True)