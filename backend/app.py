from flask_cors import CORS
from flask import Flask, jsonify, request
from uuid import uuid4

app = Flask(__name__)
CORS(app)

# Hardcoded sneaker products
sneakers = [
    {"id": 1, "name": "Nike Air Jordan", "price": 120.0, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "stock": 10},
    {"id": 2, "name": "Adidas Yeezy", "price": 200.0, "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", "stock": 5},
    {"id": 3, "name": "Converse Chuck Taylor", "price": 60.0, "image_url": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400", "stock": 15},
    {"id": 4, "name": "Vans Old Skool", "price": 80.0, "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400", "stock": 8},
    {"id": 5, "name": "Reebok Classic", "price": 100.0, "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400", "stock": 12},
    {"id": 6, "name": "New Balance 574", "price": 140.0, "image_url": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400", "stock": 9}
]

# In-memory cart storage
carts = {}

# GET /api/products
@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(sneakers)

# POST /api/cart
@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    try:
        data = request.json
        session_id = data.get('session_id')
        product_id = data.get('product_id')
        if not session_id or not product_id:
            return jsonify({"error": "Missing session_id or product_id"}), 400
        product = next((p for p in sneakers if p['id'] == product_id), None)
        if not product:
            return jsonify({"error": "Product not found"}), 404
        if product['stock'] <= 0:
            return jsonify({"error": "Product out of stock"}), 400
        if session_id not in carts:
            carts[session_id] = []
        carts[session_id].append(product)
        product['stock'] -= 1
        return jsonify({"message": "Product added to cart"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET /api/cart/<session_id>
@app.route('/api/cart/<session_id>', methods=['GET'])
def get_cart(session_id):
    try:
        if session_id not in carts:
            return jsonify({"error": "Cart not found"}), 404
        return jsonify(carts[session_id])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# POST /api/orders
@app.route('/api/orders', methods=['POST'])
def checkout():
    try:
        data = request.json
        session_id = data.get('session_id')
        if not session_id:
            return jsonify({"error": "Missing session_id"}), 400
        if session_id not in carts:
            return jsonify({"error": "Cart not found"}), 404
        cart = carts[session_id]
        total = sum(p['price'] for p in cart)
        # Create order and update stock
        order = {"session_id": session_id, "total": total, "products": cart}
        # Clear cart
        del carts[session_id]
        return jsonify({"order": order, "message": "Order created successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)