from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum

db = SQLAlchemy()

class Role(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    AUDIT = "AUDIT"

class MarketStatus(enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class BetStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    WON = "WON"
    LOST = "LOST"
    CANCELLED = "CANCELLED"

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)
    role = db.Column(db.Enum(Role), default=Role.USER, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    markets = db.relationship('Market', backref='creator', lazy=True)
    bets = db.relationship('Bet', backref='user', lazy=True)
    resolutions = db.relationship('Resolution', backref='resolver', lazy=True)
    stripe_payments = db.relationship('StripePayment', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        return self.role == Role.ADMIN
    
    def is_audit(self):
        return self.role == Role.AUDIT

class Market(db.Model):
    __tablename__ = 'markets'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False, default='Other')
    image_url = db.Column(db.String(500), nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    yes_pool = db.Column(db.Float, default=0.0)
    no_pool = db.Column(db.Float, default=0.0)
    total_volume = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum(MarketStatus), default=MarketStatus.OPEN)
    resolution = db.Column(db.Boolean, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closes_at = db.Column(db.DateTime, nullable=True)
    vig_percent = db.Column(db.Float, default=2.5)
    
    bets = db.relationship('Bet', backref='market', lazy=True, order_by='Bet.created_at.desc()')
    resolutions_list = db.relationship('Resolution', backref='market', lazy=True)
    stripe_payments = db.relationship('StripePayment', backref='market', lazy=True)

class Bet(db.Model):
    __tablename__ = 'bets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    outcome = db.Column(db.Boolean, nullable=False)  # True = YES, False = NO
    shares = db.Column(db.Float, nullable=False)
    status = db.Column(db.Enum(BetStatus), default=BetStatus.ACTIVE)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    claimed_at = db.Column(db.DateTime, nullable=True)

class Resolution(db.Model):
    __tablename__ = 'resolutions'
    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    resolver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    outcome = db.Column(db.Boolean, nullable=False)
    evidence_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StripePayment(db.Model):
    __tablename__ = 'stripe_payments'
    id = db.Column(db.Integer, primary_key=True)
    payment_intent_id = db.Column(db.String(255), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    outcome = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
