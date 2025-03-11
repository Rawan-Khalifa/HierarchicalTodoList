from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registers a new user with a hashed password.
    Expects JSON: { "username": "...", "password": "..." }
    """
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    print('data:',data)

    # Validate input
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    # Hash the password
    hashed_pw = generate_password_hash(password)

    # Create and save the new user
    new_user = User(username=username, password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Logs in a user by checking their credentials.
    Expects JSON: { "username": "...", "password": "..." }
    """
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    print("data login:", data)
    print("username:", username)
    print("password:", password)

    # Validate input
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    # Check if user exists
    user = User.query.filter_by(username=username).first()
    print("user:",user)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Verify password
    if not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Log in the user (Flask-Login)
    try:
        login_success = login_user(user)
        print("User:", user)
        print("Login success:", login_success)
        if login_success:
            return jsonify({
                "message": "Logged in successfully",
                "user": {
                    "id": user.id,
                    "username": user.username
                }
            }), 200
        else:
            return jsonify({"error": "Login failed"}), 401
    except Exception as e:
        print(e)
        return jsonify({"error": "An error occurred during login"}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """
    Logs out the current user.
    """
    logout_user()
    return jsonify({"message": "Logged out"}), 200
