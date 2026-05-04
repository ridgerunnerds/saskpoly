import os
import stripe
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate
from config import Config
from models import db, User, Market, Bet, Resolution, StripePayment, Role, MarketStatus, BetStatus

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please sign in to access this page.'

stripe.api_key = Config.STRIPE_SECRET_KEY

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ============================================================
# Helpers
# ============================================================

def calculate_shares(market, outcome, net_amount):
    if outcome:
        if market.yes_pool == 0:
            return net_amount
        return (net_amount * market.no_pool) / market.yes_pool
    else:
        if market.no_pool == 0:
            return net_amount
        return (net_amount * market.yes_pool) / market.no_pool

# ============================================================
# Auth Routes
# ============================================================

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        name = request.form.get('name', '').strip()
        password = request.form.get('password', '')
        if not email or not password:
            flash('Email and password are required.', 'error')
            return redirect(url_for('register'))
        if User.query.filter_by(email=email).first():
            flash('An account with that email already exists.', 'error')
            return redirect(url_for('register'))
        user = User(email=email, name=name or email.split('@')[0], role=Role.USER)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        flash('Account created successfully!', 'success')
        return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        user = User.query.filter_by(email=email).first()
        
        if user and user.password_hash and user.check_password(password):
            login_user(user)
            flash('Signed in successfully.', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        
        # Staff login fallback
        is_admin = password == Config.ADMIN_PASSWORD
        is_audit = password == Config.AUDIT_PASSWORD
        if is_admin or is_audit:
            if not user:
                user = User(
                    email=email,
                    name='Admin' if is_admin else 'Auditor',
                    role=Role.ADMIN if is_admin else Role.AUDIT
                )
                db.session.add(user)
                db.session.commit()
            else:
                user.role = Role.ADMIN if is_admin else Role.AUDIT
                db.session.commit()
            login_user(user)
            flash('Signed in as staff.', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        
        flash('Invalid email or password.', 'error')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Signed out.', 'success')
    return redirect(url_for('index'))

# ============================================================
# Public Pages
# ============================================================

@app.route('/')
def index():
    markets = Market.query.all()
    stats = {
        'markets': len(markets),
        'volume': sum(m.total_volume for m in markets)
    }
    return render_template('index.html', stats=stats)

@app.route('/markets')
def markets():
    markets = Market.query.order_by(Market.created_at.desc()).all()
    return render_template('markets.html', markets=markets)

@app.route('/markets/<int:id>')
def market_detail(id):
    market = Market.query.get_or_404(id)
    yes_odds = 50.0
    total_pool = market.yes_pool + market.no_pool
    if total_pool > 0:
        yes_odds = (market.yes_pool / total_pool) * 100
    stripe_key = Config.STRIPE_PUBLISHABLE_KEY
    return render_template('market_detail.html', market=market, yes_odds=yes_odds, stripe_key=stripe_key)

# ============================================================
# Dashboard
# ============================================================

@app.route('/dashboard')
@login_required
def dashboard():
    bets = Bet.query.filter_by(user_id=current_user.id).order_by(Bet.created_at.desc()).all()
    total_wagered = sum(b.amount for b in bets)
    total_bets = len(bets)
    
    wins = sum(1 for b in bets if b.status == BetStatus.WON)
    losses = sum(1 for b in bets if b.status == BetStatus.LOST)
    active = sum(1 for b in bets if b.status == BetStatus.ACTIVE)
    
    # Profit/loss calculation
    total_profit = 0.0
    for b in bets:
        if b.status == BetStatus.WON:
            total_profit += (b.shares - b.amount)
        elif b.status == BetStatus.LOST:
            total_profit -= b.amount
    
    # Category breakdown
    categories = {}
    for b in bets:
        cat = b.market.category
        categories[cat] = categories.get(cat, 0) + b.amount
    
    # Recent 30 days activity
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_bets = [b for b in bets if b.created_at >= thirty_days_ago]
    
    return render_template('dashboard.html',
                           bets=bets,
                           total_wagered=total_wagered,
                           total_bets=total_bets,
                           wins=wins,
                           losses=losses,
                           active=active,
                           total_profit=total_profit,
                           categories=categories,
                           recent_bets=recent_bets)

@app.route('/api/dashboard/charts')
@login_required
def dashboard_charts():
    bets = Bet.query.filter_by(user_id=current_user.id).order_by(Bet.created_at).all()
    
    # P/L over time (daily)
    daily_pl = {}
    running = 0.0
    for b in bets:
        date_key = b.created_at.strftime('%Y-%m-%d')
        if b.status == BetStatus.WON:
            running += (b.shares - b.amount)
        elif b.status == BetStatus.LOST:
            running -= b.amount
        daily_pl[date_key] = running
    
    # Bets by category
    cat_data = {}
    for b in bets:
        cat = b.market.category
        cat_data[cat] = cat_data.get(cat, 0) + 1
    
    # Monthly volume
    monthly = {}
    for b in bets:
        month_key = b.created_at.strftime('%Y-%m')
        monthly[month_key] = monthly.get(month_key, 0) + b.amount
    
    return jsonify({
        'pl_over_time': {'labels': list(daily_pl.keys()), 'data': list(daily_pl.values())},
        'bets_by_category': {'labels': list(cat_data.keys()), 'data': list(cat_data.values())},
        'monthly_volume': {'labels': list(monthly.keys()), 'data': list(monthly.values())}
    })

# ============================================================
# Market Creation
# ============================================================

@app.route('/create', methods=['GET', 'POST'])
@login_required
def create_market():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category = request.form.get('category', 'Other')
        closes_at = request.form.get('closes_at')
        vig = float(request.form.get('vig_percent', 2.5))
        
        if not title or not description:
            flash('Title and description are required.', 'error')
            return redirect(url_for('create_market'))
        
        market = Market(
            title=title,
            description=description,
            category=category,
            creator_id=current_user.id,
            vig_percent=vig,
            closes_at=datetime.fromisoformat(closes_at) if closes_at else None
        )
        db.session.add(market)
        db.session.commit()
        flash('Market created!', 'success')
        return redirect(url_for('market_detail', id=market.id))
    return render_template('create_market.html')

# ============================================================
# Stripe & Betting
# ============================================================

@app.route('/api/stripe/payment-intent', methods=['POST'])
@login_required
def create_payment_intent():
    data = request.get_json() or {}
    amount = float(data.get('amount', 0))
    market_id = data.get('market_id')
    outcome = data.get('outcome')
    
    if amount <= 0 or not market_id or outcome is None:
        return jsonify({'error': 'Invalid parameters'}), 400
    
    market = Market.query.get(market_id)
    if not market or market.status != MarketStatus.OPEN:
        return jsonify({'error': 'Market not open'}), 400
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(round(amount * 100)),
            currency='cad',
            automatic_payment_methods={'enabled': True},
            metadata={
                'market_id': str(market_id),
                'outcome': str(outcome),
                'user_id': str(current_user.id)
            }
        )
        
        sp = StripePayment(
            payment_intent_id=intent.id,
            amount=amount,
            status='pending',
            user_id=current_user.id,
            market_id=market_id,
            outcome=bool(outcome)
        )
        db.session.add(sp)
        db.session.commit()
        
        return jsonify({'client_secret': intent.client_secret})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bets', methods=['POST'])
@login_required
def place_bet():
    data = request.get_json() or {}
    market_id = data.get('market_id')
    amount = float(data.get('amount', 0))
    outcome = data.get('outcome')
    payment_intent_id = data.get('payment_intent_id')
    
    if not payment_intent_id:
        return jsonify({'error': 'Payment intent ID required'}), 400
    
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except Exception as e:
        return jsonify({'error': 'Invalid payment intent'}), 400
    
    if intent.status != 'succeeded':
        return jsonify({'error': 'Payment not completed'}), 400
    
    if (intent.metadata.get('market_id') != str(market_id) or
        intent.metadata.get('user_id') != str(current_user.id) or
        intent.metadata.get('outcome') != str(outcome)):
        return jsonify({'error': 'Payment metadata mismatch'}), 400
    
    market = Market.query.get(market_id)
    if not market or market.status != MarketStatus.OPEN:
        return jsonify({'error': 'Market not open'}), 400
    
    sp = StripePayment.query.filter_by(payment_intent_id=payment_intent_id).first()
    if sp and sp.status == 'succeeded':
        return jsonify({'error': 'Payment already used'}), 400
    
    vig = amount * (market.vig_percent / 100)
    net = amount - vig
    shares = calculate_shares(market, bool(outcome), net)
    
    bet = Bet(
        user_id=current_user.id,
        market_id=market_id,
        amount=amount,
        outcome=bool(outcome),
        shares=shares,
        status=BetStatus.ACTIVE
    )
    db.session.add(bet)
    
    if outcome:
        market.yes_pool += net
    else:
        market.no_pool += net
    market.total_volume += amount
    
    if sp:
        sp.status = 'succeeded'
    
    db.session.commit()
    return jsonify({'id': bet.id, 'shares': shares})

# ============================================================
# Resolution
# ============================================================

@app.route('/api/markets/<int:id>/resolve', methods=['POST'])
@login_required
def resolve_market(id):
    if not (current_user.is_admin() or current_user.is_audit()):
        return jsonify({'error': 'Forbidden'}), 403
    
    data = request.get_json() or {}
    outcome = data.get('outcome')
    
    market = Market.query.get_or_404(id)
    if market.status != MarketStatus.OPEN:
        return jsonify({'error': 'Market not open'}), 400
    
    market.status = MarketStatus.RESOLVED
    market.resolution = bool(outcome)
    market.resolved_at = datetime.utcnow()
    
    # Update all bets
    for bet in market.bets:
        if bet.outcome == market.resolution:
            bet.status = BetStatus.WON
        else:
            bet.status = BetStatus.LOST
    
    resolution = Resolution(
        market_id=id,
        resolver_id=current_user.id,
        outcome=bool(outcome)
    )
    db.session.add(resolution)
    db.session.commit()
    
    return jsonify({'success': True})

# ============================================================
# Admin
# ============================================================

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin():
        flash('Admin access required.', 'error')
        return redirect(url_for('index'))
    markets = Market.query.order_by(Market.created_at.desc()).all()
    users = User.query.order_by(User.created_at.desc()).all()
    total_volume = sum(m.total_volume for m in markets)
    return render_template('admin.html', markets=markets, users=users, total_volume=total_volume)

@app.route('/api/admin/users')
@login_required
def admin_users():
    if not current_user.is_admin():
        return jsonify({'error': 'Forbidden'}), 403
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{'id': u.id, 'email': u.email, 'name': u.name, 'role': u.role.value, 'created_at': u.created_at.isoformat()} for u in users])

# ============================================================
# Audit
# ============================================================

@app.route('/audit')
@login_required
def audit():
    if not (current_user.is_admin() or current_user.is_audit()):
        flash('Audit access required.', 'error')
        return redirect(url_for('index'))
    markets = Market.query.order_by(Market.created_at.desc()).all()
    return render_template('audit.html', markets=markets)

# ============================================================
# API
# ============================================================

@app.route('/api/markets')
def api_markets():
    markets = Market.query.order_by(Market.created_at.desc()).all()
    return jsonify([m.to_dict() if hasattr(m, 'to_dict') else {
        'id': m.id,
        'title': m.title,
        'description': m.description,
        'category': m.category,
        'yes_pool': m.yes_pool,
        'no_pool': m.no_pool,
        'total_volume': m.total_volume,
        'status': m.status.value,
        'resolution': m.resolution,
        'resolved_at': m.resolved_at.isoformat() if m.resolved_at else None,
        'created_at': m.created_at.isoformat(),
        'closes_at': m.closes_at.isoformat() if m.closes_at else None,
        'vig_percent': m.vig_percent,
        'creator': {'name': m.creator.name, 'email': m.creator.email}
    } for m in markets])

@app.route('/api/markets/<int:id>')
def api_market(id):
    m = Market.query.get_or_404(id)
    return jsonify({
        'id': m.id,
        'title': m.title,
        'description': m.description,
        'category': m.category,
        'yes_pool': m.yes_pool,
        'no_pool': m.no_pool,
        'total_volume': m.total_volume,
        'status': m.status.value,
        'resolution': m.resolution,
        'resolved_at': m.resolved_at.isoformat() if m.resolved_at else None,
        'created_at': m.created_at.isoformat(),
        'closes_at': m.closes_at.isoformat() if m.closes_at else None,
        'vig_percent': m.vig_percent,
        'creator': {'name': m.creator.name, 'email': m.creator.email},
        'bets': [{
            'id': b.id,
            'amount': b.amount,
            'outcome': b.outcome,
            'status': b.status.value,
            'created_at': b.created_at.isoformat(),
            'user': {'name': b.user.name, 'email': b.user.email}
        } for b in m.bets]
    })

# ============================================================
# Context Processors
# ============================================================

@app.context_processor
def inject_globals():
    return {
        'stripe_publishable_key': Config.STRIPE_PUBLISHABLE_KEY,
        'now': datetime.utcnow
    }

# ============================================================
# Init DB
# ============================================================

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
