from flask import Blueprint, request, jsonify
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Basic validation (in production, add proper error handling and password hashing)
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username, password=password).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    # For simplicity, we return a success message (in production, use tokens/sessions)
    return jsonify({"message": "Logged in successfully", "user_id": user.id}), 200
