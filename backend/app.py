from flask import Flask, request, jsonify
import sqlite3
import uuid
import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Connect to SQLite database
def get_db_connection():
    conn = sqlite3.connect('ecommerce.db')
    conn.row_factory = sqlite3.Row
    return conn

# Create tables if they don't exist
def create_tables():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY,
            session_id TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            session_id TEXT NOT NULL,
            order_date TEXT NOT NULL,
            total REAL NOT NULL
        )
    ''')
    conn.close()

# Seed products table with 5 electronics products
def seed_products():
    conn = get_db_connection()
    count = conn.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    if count == 0:  # Only seed if empty
        products = [
            ('Apple iPhone 13', 999.99),
            ('Samsung 4K TV', 1299.99),
            ('Sony PlayStation 5', 499.99),
            ('Dell Inspiron Laptop', 799.99),
            ('Canon EOS Camera', 899.99)
        ]
        conn.executemany('INSERT INTO products (name, price) VALUES (?, ?)', products)
        conn.commit()
    conn.close()

create_tables()
seed_products()

# GET /api/products
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(product) for product in products])

# GET /api/products/<id>
@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (id,)).fetchone()
    conn.close()
    if product is None:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(dict(product))

# POST /api/cart
@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    data = request.json
    if 'product_id' not in data or 'quantity' not in data:
        return jsonify({'error': 'Invalid request'}), 400
    conn = get_db_connection()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (data['product_id'],)).fetchone()
    if product is None:
        return jsonify({'error': 'Product not found'}), 404
    session_id = request.cookies.get('session_id')
    if session_id is None:
        session_id = str(uuid.uuid4())
    conn.execute('''
        INSERT INTO cart (session_id, product_id, quantity)
        VALUES (?, ?, ?)
    ''', (session_id, data['product_id'], data['quantity']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Product added to cart'})

# GET /api/cart/<session_id>
@app.route('/api/cart/<string:session_id>', methods=['GET'])
def get_cart(session_id):
    conn = get_db_connection()
    cart = conn.execute('''
        SELECT p.name, p.price, c.quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = ?
    ''', (session_id,)).fetchall()
    conn.close()
    return jsonify([dict(item) for item in cart])

# POST /api/orders
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    if 'session_id' not in data:
        return jsonify({'error': 'Invalid request'}), 400
    conn = get_db_connection()
    cart = conn.execute('''
        SELECT p.price, c.quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = ?
    ''', (data['session_id'],)).fetchall()
    if not cart:
        return jsonify({'error': 'Cart is empty'}), 400
    total = sum(item['price'] * item['quantity'] for item in cart)
    conn.execute('''
        INSERT INTO orders (session_id, order_date, total)
        VALUES (?, ?, ?)
    ''', (data['session_id'], datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), total))
    conn.commit()
    conn.execute('DELETE FROM cart WHERE session_id = ?', (data['session_id'],))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Order created successfully'})

# GET /api/orders/<id>
@app.route('/api/orders/<int:id>', methods=['GET'])
def get_order(id):
    conn = get_db_connection()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (id,)).fetchone()
    conn.close()
    if order is None:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(dict(order))

if __name__ == '__main__':
    app.run(debug=True)
