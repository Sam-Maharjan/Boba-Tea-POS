import os
import requests
from datetime import datetime, date
from decimal import Decimal

from flask import Flask, jsonify, request, session, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    PrimaryKeyConstraint,
    Enum as SAEnum,
    text,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.exc import SQLAlchemyError

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

frontend_url = os.getenv("REACT_APP_FRONTEND_URL")

app = Flask(__name__)
CORS(app)
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
)

API_BASE_URL = os.getenv(
    "REACT_APP_BACKEND_URL", "https://project-3-group-11.onrender.com"
)
app.secret_key = os.getenv("FLASK_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
GOOGLE_REDIRECT_URI = f"{API_BASE_URL}/api/oauth2/callback"

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql://"
    + os.getenv("PSQL_USER")
    + ":"
    + os.getenv("PSQL_PASSWORD")
    + "@"
    + os.getenv("PSQL_HOST")
    + ":"
    + os.getenv("PSQL_PORT")
    + "/"
    + os.getenv("PSQL_DATABASE")
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

Base = declarative_base()

EmployeeRole = SAEnum("Cashier", "Manager", name="employee_role", native_enum=True)
ModificationType = SAEnum(
    "ADD", "REMOVE", "LESS", "EXTRA", name="modification_type", native_enum=True
)
SugarLevel = SAEnum(
    "200%",
    "150%",
    "100%",
    "80%",
    "50%",
    "30%",
    "0%",
    name="sugar_level",
    native_enum=True,
)
SizeLevel = SAEnum("small", "normal", "large", name="size_level", native_enum=True)
IceLevel = SAEnum(
    "no_ice", "less", "regular", "hot", name="ice_level", native_enum=True
)

ALLOWED_ROLES = {"Cashier", "Manager"}


def norm_role(x):
    return x.strip().title() if isinstance(x, str) else None


def _ser(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return v


def _maprow(m):
    return {k: _ser(v) for k, v in dict(m).items()}


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    role = Column("role", EmployeeRole, nullable=False)
    email = Column(String, nullable=True)

    orders = relationship("Order", back_populates="employee")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    order_date = Column(DateTime, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    employee = relationship("Employee", back_populates="orders")
    user = relationship("User", back_populates="orders")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True)
    product_name = Column(String, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    vegan = Column(Boolean, nullable=False, default=True)
    category = Column(String, nullable=True)

    recipe = relationship("ProductRecipe", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")


class Inventory(Base):
    __tablename__ = "inventory"

    ingredient_id = Column(Integer, primary_key=True)
    ingredient_name = Column(String, nullable=False)
    on_hand_quantity = Column(Numeric(10, 1), nullable=False)
    is_add_on = Column(Boolean, nullable=False, default=False)
    price_per_unit = Column(Numeric(10, 2), nullable=True)

    recipe_entries = relationship("ProductRecipe", back_populates="ingredient")
    modifications = relationship("Modification", back_populates="ingredient")


class ProductRecipe(Base):
    __tablename__ = "product_recipe"

    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    ingredient_id = Column(
        Integer, ForeignKey("inventory.ingredient_id"), nullable=False
    )
    quantity_per_unit = Column(Numeric(10, 1), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("product_id", "ingredient_id", name="pk_product_recipe"),
    )

    product = relationship("Product", back_populates="recipe")
    ingredient = relationship("Inventory", back_populates="recipe_entries")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price_at_sale = Column(Numeric(10, 2), nullable=False)
    sugar_level = Column(SugarLevel, nullable=False, default="100%")
    size_level = Column(SizeLevel, nullable=False, default="normal")
    ice_level = Column(IceLevel, nullable=False, default="regular")

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    modifications = relationship(
        "Modification", back_populates="order_item", cascade="all, delete-orphan"
    )


class Modification(Base):
    __tablename__ = "modifications"

    modification_id = Column(Integer, primary_key=True)
    order_item_id = Column(
        Integer, ForeignKey("order_items.order_item_id"), nullable=False
    )
    ingredient_id = Column(
        Integer, ForeignKey("inventory.ingredient_id"), nullable=False
    )
    modification_type = Column(ModificationType, nullable=False)
    quantity_change = Column(Numeric(10, 1), nullable=True)
    price_change = Column(Numeric(10, 2), nullable=True)

    order_item = relationship("OrderItem", back_populates="modifications")
    ingredient = relationship("Inventory", back_populates="modifications")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    google_sub = Column(
        String, unique=True, nullable=True
    )  # Made nullable for Clerk users
    clerk_user_id = Column(String, unique=True, nullable=True)  # New Clerk ID
    email = Column(String, nullable=True)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="Customer")

    orders = relationship("Order", back_populates="user")


@app.route("/", methods=["GET"])
def root():
    return jsonify(
        {
            "status": "ok",
            "service": "flask",
            "routes": [
                "/api/health",
                "/api/fetchProducts",
                "/api/modifications",
                "api/product_categories",
                "/api/postOrder (supports both employee and customer orders)",
                "/api/inventory",
                "/api/employees",
                "/api/login",
                "/api/oauth2/callback",
            ],
        }
    )


@app.route("/api/login")
def login():
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        "?response_type=code"
        "&client_id="
        + GOOGLE_CLIENT_ID
        + "&redirect_uri="
        + GOOGLE_REDIRECT_URI
        + "&scope=openid%20email%20profile"
    )
    return redirect(google_auth_url)


@app.route("/api/oauth2/callback")
def oauth_callback():
    code = request.args.get("code")

    try:
        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        ).json()

        access_token = token_res.get("access_token")
        if not access_token:
            return "Failed to get access token", 400

        userinfo = requests.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        ).json()

        google_sub = userinfo["sub"]
        email = userinfo.get("email")
        name = userinfo.get("name")

        user = db.session.execute(
            text(
                "SELECT user_id, google_sub, email, name, role FROM users WHERE google_sub = :sub"
            ),
            {"sub": google_sub},
        ).first()

        if not user:
            result = db.session.execute(
                text(
                    """
                    WITH next AS (
                        SELECT COALESCE(MAX(user_id), 0) + 1 AS id FROM users
                    )
                    INSERT INTO users (user_id, google_sub, email, name, role)
                    SELECT next.id, :sub, :email, :name, :role FROM next
                    RETURNING user_id, google_sub, email, name, role
                """
                ),
                {"sub": google_sub, "email": email, "name": name, "role": "Customer"},
            )
            user = result.first()
            db.session.commit()

        session["google_sub"] = user[1]
        session["user_id"] = user[0]
        session["role"] = user[4]
        session["name"] = user[3]

        return redirect(frontend_url)

    except Exception as e:
        print(f"OAuth error: {e}")
        return f"Authentication failed: {str(e)}", 500


@app.route("/api/me")
def me():
    if "google_sub" not in session:
        return jsonify({"logged_in": False})

    return jsonify(
        {
            "logged_in": True,
            "user_id": session.get("user_id"),
            "name": session.get("name"),
            "role": session.get("role"),
        }
    )


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/health", methods=["GET"])
def health():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "up"}), 200
    except Exception as e:
        return jsonify({"status": "error", "db": "down", "error": str(e)}), 500


@app.route("/api/fetchProducts", methods=["GET"])
def fetchProducts():
    rows = (
        db.session.execute(text("SELECT * FROM products ORDER BY product_id"))
        .mappings()
        .all()
    )
    return jsonify([_maprow(r) for r in rows])


@app.route("/api/modifications", methods=["GET"])
def get_modifications():
    # Only get addon ingredients
    all_ingredients = db.session.query(Inventory).filter_by(is_add_on=True).all()

    modifications = []
    for ingredient in all_ingredients:
        modifications.append(
            {
                "ingredient_id": ingredient.ingredient_id,
                "ingredient_name": ingredient.ingredient_name,
                "price_per_unit": (
                    float(ingredient.price_per_unit)
                    if ingredient.price_per_unit
                    else 0.0
                ),
                "possible_modification": "ADD",
            }
        )

    return jsonify(modifications)


@app.route("/api/product_categories", methods=["GET"])
def get_product_categories():
    all_categories = [c[0] for c in db.session.query(Product.category).distinct().all()]

    return jsonify(all_categories)


@app.route("/api/products/<int:product_id>/recipe", methods=["GET"])
def get_product_recipe(product_id):
    try:
        rows = (
            db.session.execute(
                text(
                    """
            SELECT pr.ingredient_id, i.ingredient_name, pr.quantity_per_unit
            FROM product_recipe pr
            JOIN inventory i ON pr.ingredient_id = i.ingredient_id
            WHERE pr.product_id = :pid
            ORDER BY i.ingredient_name
        """
                ),
                {"pid": product_id},
            )
            .mappings()
            .all()
        )
        return jsonify([_maprow(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:product_id>/price", methods=["PUT"])
def update_product_price(product_id):
    try:
        body = request.get_json(force=True) or {}
        new_price = body.get("unit_price")

        if new_price is None:
            return jsonify({"error": "unit_price is required"}), 400

        price_decimal = Decimal(str(new_price))
        if price_decimal <= 0:
            return jsonify({"error": "unit_price must be positive"}), 400

        result = db.session.execute(
            text(
                "UPDATE products SET unit_price = :price WHERE product_id = :id RETURNING product_name, unit_price"
            ),
            {"price": price_decimal, "id": product_id},
        ).first()

        if result is None:
            return jsonify({"error": "Product not found"}), 404

        db.session.commit()
        return (
            jsonify(
                {
                    "ok": True,
                    "product_id": product_id,
                    "product_name": result[0],
                    "unit_price": float(result[1]),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def send_order_receipt(user_email, user_name, order_id, items, total_amount):
    """Send order receipt email using SendGrid API."""

    try:
        api_key = os.getenv("SENDGRID_API_KEY")
        sender_email = os.getenv("SENDER_EMAIL")

        if not api_key or not sender_email:
            print("SendGrid environment variables missing")
            return False

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #333;">Order Confirmation</h2>
                    <p>Hi {user_name},</p>
                    <p>Thank you for your order! Here are your order details:</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #666; margin-top: 0;">Order #{order_id}</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #ddd;">
                                    <th style="text-align: left; padding: 10px;">Item</th>
                                    <th style="text-align: center; padding: 10px;">Qty</th>
                                    <th style="text-align: right; padding: 10px;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
        """

        for item in items:
            item_total = float(item["quantity"]) * float(item["unit_price_at_sale"])
            html_content += f"""
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">{item.get('product_name', 'Item')}</td>
                    <td style="text-align: center; padding: 10px;">{item['quantity']}</td>
                    <td style="text-align: right; padding: 10px;">${item_total:.2f}</td>
                </tr>
            """

            # Add customizations if any
            customizations = []
            if item.get("sugar_level"):
                customizations.append(f"Sugar: {item['sugar_level']}")
            if item.get("size_level"):
                customizations.append(f"Size: {item['size_level']}")
            if item.get("ice_level"):
                customizations.append(f"Ice: {item['ice_level']}")

            if customizations:
                for customization in customizations:
                    html_content += f"""
                                <tr>
                                    <td colspan="3" style="padding: 5px 10px 5px 30px; font-size: 0.9em; color: #666;">
                                        • {customization}
                                    </td>
                                </tr>
            """

            # Add modifications if any
            if item.get("modifications"):
                for mod in item["modifications"]:
                    html_content += f"""
                        <tr>
                            <td colspan="3" style="padding: 5px 10px 5px 30px; font-size: 0.9em; color: #666;">
                                • {mod.get('modification_type', '')}: {mod.get('ingredient_name', '')}
                            </td>
                        </tr>
                    """

        html_content += f"""
                            </tbody>
                        </table>

                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #333;">
                            <h3 style="text-align: right; margin: 0;">Total: ${float(total_amount):.2f}</h3>
                        </div>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9em;">
                        Thank you for your business! If you have any questions about your order,
                        please don't hesitate to contact us.
                    </p>
                </div>
            </body>
        </html>
        """

        message = Mail(
            from_email=sender_email,
            to_emails=user_email,
            subject=f"Order Confirmation - #{order_id}",
            html_content=html_content,
        )

        sg = SendGridAPIClient(api_key)
        response = sg.send(message)

        if response.status_code != 202:
            print(f"SendGrid returned status {response.status_code}")

        print(f"SendGrid: email sent to {user_email}")
        return True

    except Exception as e:
        print(f"SendGrid email failed: {str(e)}")
        return False


@app.route("/api/postOrder", methods=["POST"])
def post_order():
    data = request.get_json()
    try:
        session = db.session

        employee_id = data.get("employee_id")
        clerk_user_id = data.get("clerk_user_id")
        user_email = data.get("user_email")
        user_name = data.get("user_name")

        # Handle Clerk authentication - find or create user
        user_id = None
        if clerk_user_id:
            user = session.execute(
                text(
                    "SELECT user_id, email, name FROM users WHERE clerk_user_id = :clerk_id"
                ),
                {"clerk_id": clerk_user_id},
            ).first()

            if not user:
                result = session.execute(
                    text(
                        """
                        WITH next AS (
                            SELECT COALESCE(MAX(user_id), 0) + 1 AS id FROM users
                        )
                        INSERT INTO users (user_id, clerk_user_id, email, name, role)
                        SELECT next.id, :clerk_id, :email, :name, 'Customer' FROM next
                        RETURNING user_id, email, name
                    """
                    ),
                    {"clerk_id": clerk_user_id, "email": user_email, "name": user_name},
                )
                user = result.first()
                session.commit()

            user_id = user[0]
            # Use database values if available, otherwise use provided values
            user_email = user[1] or user_email
            user_name = user[2] or user_name

        if not employee_id and not user_id:
            return (
                jsonify(
                    {"error": "Either employee_id or clerk_user_id must be provided"}
                ),
                400,
            )

        new_order = Order(
            total_amount=Decimal(str(data["total_amount"])),
            employee_id=employee_id,
            user_id=user_id,
            order_date=datetime.now(),
        )
        session.add(new_order)
        session.flush()

        # Store items with product names for email
        items_for_email = []

        for item_data in data["items"]:
            # Get product name for email
            product = session.get(Product, item_data["product_id"])

            item = OrderItem(
                order_id=new_order.order_id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price_at_sale=Decimal(str(item_data["unit_price_at_sale"])),
                sugar_level=item_data.get("sugar_level", "100%"),
                size_level=item_data.get("size_level", "normal"),
                ice_level=item_data.get("ice_level", "regular"),
            )
            session.add(item)
            session.flush()

            # Prepare item data for email
            email_item = {
                "product_name": product.product_name if product else "Unknown Product",
                "quantity": item_data["quantity"],
                "unit_price_at_sale": item_data["unit_price_at_sale"],
                "sugar_level": item_data.get("sugar_level", "100%"),
                "size_level": item_data.get("size_level", "normal"),
                "ice_level": item_data.get("ice_level", "regular"),
                "modifications": [],
            }

            for mod_data in item_data.get("modifications", []):
                # Get ingredient name for email
                ingredient = session.get(Inventory, mod_data["ingredient_id"])

                # Map possible_modification to modification_type
                mod_type = mod_data.get("modification_type") or mod_data.get(
                    "possible_modification", "ADD"
                )

                mod = Modification(
                    order_item_id=item.order_item_id,
                    ingredient_id=mod_data["ingredient_id"],
                    modification_type=mod_type,
                    quantity_change=Decimal(str(mod_data.get("quantity_change", 0))),
                    price_change=Decimal(str(mod_data.get("price_change", 0))),
                )
                session.add(mod)

                # Add modification info for email
                email_item["modifications"].append(
                    {
                        "modification_type": mod_type,
                        "ingredient_name": (
                            ingredient.ingredient_name
                            if ingredient
                            else "Unknown Ingredient"
                        ),
                    }
                )

            items_for_email.append(email_item)

        session.flush()

        # Update inventory
        for item_data in data["items"]:
            product = session.get(Product, item_data["product_id"])
            if not product:
                continue

            size_level = item_data.get("size_level", "normal")
            cup_name_map = {"small": "Small Cup", "normal": "Medium Cup", "large": "Large Cup"}
            cup_name = cup_name_map.get(size_level, "Medium Cup")
            
            cup = session.execute(
                text("SELECT ingredient_id FROM inventory WHERE ingredient_name = :name LIMIT 1"),
                {"name": cup_name}
            ).first()
            if cup:
                cup_inv = session.get(Inventory, cup[0])
                if cup_inv:
                    cup_inv.on_hand_quantity -= Decimal(item_data["quantity"])

            for recipe in product.recipe:
                total_qty = recipe.quantity_per_unit * Decimal(item_data["quantity"])

                inv = session.get(Inventory, recipe.ingredient_id)
                if inv:
                    inv.on_hand_quantity -= total_qty

            for mod_data in item_data.get("modifications", []):
                inv = session.get(Inventory, mod_data["ingredient_id"])
                if inv:
                    mod_type = (
                        mod_data.get("modification_type")
                        or mod_data.get("possible_modification", "ADD")
                    ).upper()
                    qty_change = Decimal(
                        str(mod_data.get("quantity_change", 0))
                    ) * Decimal(item_data["quantity"])
                    if mod_type in ("ADD", "EXTRA"):
                        inv.on_hand_quantity -= qty_change
                    elif mod_type in ("REMOVE", "LESS"):
                        inv.on_hand_quantity += qty_change

        session.commit()

        # Send receipt email to customer
        email_sent = False
        if user_id and user_email:
            email_sent = send_order_receipt(
                user_email=user_email,
                user_name=user_name or "Customer",
                order_id=new_order.order_id,
                items=items_for_email,
                total_amount=data["total_amount"],
            )

        return (
            jsonify(
                {
                    "message": "Order posted successfully",
                    "order_id": new_order.order_id,
                    "email_sent": email_sent,
                }
            ),
            201,
        )

    except SQLAlchemyError as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    rows = (
        db.session.execute(
            text(
                """
        SELECT ingredient_id, ingredient_name, on_hand_quantity, is_add_on, price_per_unit
        FROM inventory
        ORDER BY ingredient_id
    """
            )
        )
        .mappings()
        .all()
    )
    return jsonify([_maprow(r) for r in rows])


@app.route("/api/inventory/<int:ingredient_id>", methods=["PUT"])
def update_inventory_item(ingredient_id):
    body = request.get_json(force=True) or {}
    qty = body.get("on_hand_quantity")
    db.session.execute(
        text("UPDATE inventory SET on_hand_quantity = :q WHERE ingredient_id = :id"),
        {"q": qty, "id": ingredient_id},
    )
    db.session.commit()
    return jsonify(
        {"ok": True, "ingredient_id": ingredient_id, "on_hand_quantity": qty}
    )


@app.route("/api/inventory/<int:ingredient_id>/restock", methods=["POST"])
def restock_inventory(ingredient_id):
    try:
        body = request.get_json(force=True) or {}
        delta = body.get("delta")

        if delta is None:
            return jsonify({"error": "delta is required"}), 400

        delta_decimal = Decimal(str(delta))
        if delta_decimal <= 0:
            return jsonify({"error": "delta must be positive"}), 400

        result = db.session.execute(
            text(
                "UPDATE inventory SET on_hand_quantity = on_hand_quantity + :delta WHERE ingredient_id = :id RETURNING on_hand_quantity"
            ),
            {"delta": delta_decimal, "id": ingredient_id},
        ).first()

        if result is None:
            return jsonify({"error": "Ingredient not found"}), 404

        db.session.commit()
        return (
            jsonify(
                {
                    "ok": True,
                    "ingredient_id": ingredient_id,
                    "delta": float(delta_decimal),
                    "new_quantity": float(result[0]),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/products", methods=["POST"])
def add_product():
    try:
        body = request.get_json(force=True) or {}

        result = db.session.execute(
            text(
                """
                WITH next AS (
                    SELECT COALESCE(MAX(product_id), 0) + 1 AS id FROM products
                )
                INSERT INTO products (product_id, product_name, unit_price, vegan, category)
                SELECT next.id, :name, :price, :vegan, :category FROM next
                RETURNING product_id
            """
            ),
            {
                "name": body["product_name"],
                "price": Decimal(str(body["unit_price"])),
                "vegan": body.get("vegan", False),
                "category": body.get("category", "Uncategorized"),
            },
        ).first()

        product_id = result[0]

        # Insert recipe rows
        for ing in body.get("recipe", []):
            db.session.execute(
                text(
                    """
                    INSERT INTO product_recipe (product_id, ingredient_id, quantity_per_unit)
                    VALUES (:pid, :iid, :qty)
                """
                ),
                {
                    "pid": product_id,
                    "iid": ing["ingredient_id"],
                    "qty": Decimal(str(ing["quantity_per_unit"])),
                },
            )

        db.session.commit()
        return jsonify({"product_id": product_id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory", methods=["POST"])
def add_inventory_item():
    try:
        body = request.get_json(force=True) or {}
        name = body.get("ingredient_name", "").strip()
        qty = body.get("on_hand_quantity")
        is_add_on = body.get("is_add_on", False)
        price_per_unit = body.get("price_per_unit", 0)

        if not name:
            return jsonify({"error": "ingredient_name is required"}), 400

        if qty is None:
            return jsonify({"error": "on_hand_quantity is required"}), 400

        qty_decimal = Decimal(str(qty))
        if qty_decimal < 0:
            return jsonify({"error": "on_hand_quantity cannot be negative"}), 400

        price_decimal = Decimal(str(price_per_unit))
        if price_decimal < 0:
            return jsonify({"error": "price_per_unit cannot be negative"}), 400

        # Get next ingredient_id
        row = db.session.execute(
            text(
                """
                WITH next AS (
                    SELECT COALESCE(MAX(ingredient_id), 0) + 1 AS id FROM inventory
                )
                INSERT INTO inventory (ingredient_id, ingredient_name, on_hand_quantity, is_add_on, price_per_unit)
                SELECT next.id, :name, :qty, :is_add_on, :price FROM next
                RETURNING ingredient_id, ingredient_name, on_hand_quantity, is_add_on, price_per_unit
            """
            ),
            {
                "name": name,
                "qty": qty_decimal,
                "is_add_on": is_add_on,
                "price": price_decimal,
            },
        ).first()

        db.session.commit()

        return (
            jsonify(
                {
                    "ingredient_id": row[0],
                    "ingredient_name": row[1],
                    "on_hand_quantity": float(row[2]),
                    "is_add_on": row[3],
                    "price_per_unit": float(row[4]),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/employees", methods=["GET"])
def list_employees():
    try:
        rows = (
            db.session.execute(
                text(
                    """
            SELECT employee_id, name, "role" AS role, email 
            FROM employees
            ORDER BY employee_id
        """
                )
            )
            .mappings()
            .all()
        )
        return jsonify([_maprow(r) for r in rows])
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/employees", methods=["POST"])
def add_employee():
    body = request.get_json(force=True) or {}
    name = body.get("name")
    role = norm_role(body.get("role"))
    email = body.get("email")
    if role not in ALLOWED_ROLES:
        return jsonify({"error": "invalid role", "allowed": list(ALLOWED_ROLES)}), 400
    row = db.session.execute(
        text(
            """
            WITH next AS (
            SELECT COALESCE(MAX(employee_id), 0) + 1 AS id FROM employees
            )
            INSERT INTO employees(employee_id, name, role, email)
            SELECT next.id, :n, :r, :e FROM next
            RETURNING employee_id
            """
        ),
        {"n": name, "r": role, "e": email},
    ).first()
    db.session.commit()
    return jsonify({"employee_id": row[0], "name": name, "role": role, "email": email}), 201


@app.route("/api/employees/<int:employee_id>", methods=["PUT"])
def update_employee(employee_id):
    body = request.get_json(force=True) or {}
    name = body.get("name")
    role = norm_role(body.get("role"))
    email = body.get("email")
    if role not in ALLOWED_ROLES:
        return jsonify({"error": "invalid role", "allowed": list(ALLOWED_ROLES)}), 400
    db.session.execute(
        text("UPDATE employees SET name = :n, role = :r, email =:e WHERE employee_id = :id"),
        {"n": name, "r": role, "e":email, "id": employee_id},
    )
    db.session.commit()
    return jsonify({"ok": True, "employee_id": employee_id, "name": name, "role": role})


@app.route("/api/employees/<int:employee_id>", methods=["DELETE"])
def delete_employee(employee_id):
    db.session.execute(
        text("DELETE FROM employees WHERE employee_id = :id"), {"id": employee_id}
    )
    db.session.commit()
    return jsonify({"ok": True, "employee_id": employee_id})


@app.route("/api/reports/sales", methods=["GET"])
def get_sales_report():
    """Get sales data by date range"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        # Add one day to end_date to make it inclusive
        sql = """
            SELECT p.product_id, p.product_name,
                   SUM(oi.quantity) AS qty,
                   SUM(oi.quantity * oi.unit_price_at_sale) AS revenue
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE o.order_date >= :start_date 
              AND o.order_date < DATE(:end_date) + INTERVAL '1 day'
            GROUP BY p.product_id, p.product_name
            ORDER BY revenue DESC
        """

        rows = (
            db.session.execute(
                text(sql), {"start_date": start_date, "end_date": end_date}
            )
            .mappings()
            .all()
        )

        return jsonify([_maprow(r) for r in rows])

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/x-report", methods=["GET"])
def get_x_report():
    """Get hourly sales for today (X Report)"""
    try:
        sql = """
            SELECT DATE_TRUNC('hour', order_date) AS hour,
                   SUM(total_amount) AS sales
            FROM orders
            WHERE DATE(order_date) = CURRENT_DATE
            GROUP BY hour
            ORDER BY hour
        """

        rows = db.session.execute(text(sql)).mappings().all()
        return jsonify([_maprow(r) for r in rows])

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/z-report", methods=["GET"])
def get_z_report():
    """Get daily summary report (Z Report) - today only"""
    try:
        # Get total revenue for today
        total_revenue_sql = """
            SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM orders
            WHERE DATE(order_date) = CURRENT_DATE
        """

        revenue_result = db.session.execute(text(total_revenue_sql)).first()
        total_revenue = float(revenue_result[0]) if revenue_result else 0

        # Get quantity of each item sold today
        items_sql = """
            SELECT p.product_id, p.product_name, SUM(oi.quantity) AS qty_sold
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE DATE(o.order_date) = CURRENT_DATE
            GROUP BY p.product_id, p.product_name
            ORDER BY qty_sold DESC
        """

        items = db.session.execute(text(items_sql)).mappings().all()

        return jsonify(
            {
                "total_revenue": total_revenue,
                "items": [_maprow(item) for item in items],
                "date": datetime.now().date().isoformat(),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/usage-chart", methods=["GET"])
def get_usage_chart():
    """Get ingredient usage by date range"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return jsonify({"error": "start_date and end_date are required"}), 400

        sql = """
            SELECT 
                i.ingredient_id,
                i.ingredient_name,
                COALESCE(SUM(oi.quantity * pr.quantity_per_unit), 0) AS total_used,
                i.on_hand_quantity AS current_stock,
                COUNT(DISTINCT o.order_id) AS orders_count
            FROM inventory i
            LEFT JOIN product_recipe pr ON i.ingredient_id = pr.ingredient_id
            LEFT JOIN order_items oi ON pr.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id
                AND o.order_date >= :start_date 
                AND o.order_date < DATE(:end_date) + INTERVAL '1 day'
            GROUP BY i.ingredient_id, i.ingredient_name, i.on_hand_quantity
            ORDER BY total_used DESC
        """

        rows = (
            db.session.execute(
                text(sql), {"start_date": start_date, "end_date": end_date}
            )
            .mappings()
            .all()
        )

        return jsonify([_maprow(r) for r in rows])

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/getUserOrders", methods=["POST"])
def get_user_orders():
    data = request.get_json()
    clerk_user_id = data.get("clerk_user_id")

    if not clerk_user_id:
        return jsonify({"error": "clerk_user_id required"}), 400

    try:
        # Get user's database ID from clerk ID
        user = db.session.execute(
            text("SELECT user_id FROM users WHERE clerk_user_id = :clerk_id"),
            {"clerk_id": clerk_user_id},
        ).first()

        if not user:
            return jsonify({"orders": []}), 200

        user_id = user[0]

        # Get last 5 orders with items and modifications
        orders = db.session.execute(
            text(
                """
                SELECT 
                    o.order_id,
                    o.order_date,
                    o.total_amount,
                    json_agg(
                        json_build_object(
                            'product_id', oi.product_id,
                            'product_name', p.product_name,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price_at_sale,
                            'sugar_level', oi.sugar_level,
                            'ice_level', oi.ice_level,
                            'size_level', oi.size_level,
                            'modifications', COALESCE(
                                (SELECT json_agg(
                                    json_build_object(
                                        'ingredient_id', m.ingredient_id,
                                        'ingredient_name', inv.ingredient_name,
                                        'modification_type', m.modification_type,
                                        'price_change', m.price_change
                                    )
                                )
                                FROM modifications m
                                JOIN inventory inv ON m.ingredient_id = inv.ingredient_id
                                WHERE m.order_item_id = oi.order_item_id),
                                '[]'::json
                            )
                        )
                    ) as items
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN products p ON oi.product_id = p.product_id
                WHERE o.user_id = :user_id
                GROUP BY o.order_id, o.order_date, o.total_amount
                ORDER BY o.order_date DESC
                LIMIT 5
            """
            ),
            {"user_id": user_id},
        ).fetchall()

        orders_list = [
            {
                "order_id": row[0],
                "order_date": row[1].isoformat(),
                "total_amount": float(row[2]),
                "items": row[3],
            }
            for row in orders
        ]

        return jsonify({"orders": orders_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
