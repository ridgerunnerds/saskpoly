import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')
    AUDIT_PASSWORD = os.environ.get('AUDIT_PASSWORD', 'audit')
    
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
