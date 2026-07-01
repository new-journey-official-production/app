"""PrintForge — 3D Printing Business Platform Backend
FastAPI + MongoDB. JWT auth, mocked payments/emails with clear hooks.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import bcrypt
import jwt
import logging
import secrets
import base64
import csv
import io
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query, status, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator

# ---------------------------------------------------------------------------
# Config & DB
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("printforge")

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ACCESS_MIN = 60 * 12  # 12h to keep UX smooth
REFRESH_DAYS = 30

app = FastAPI(title="PrintForge API", version="1.0.0")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=(os.environ.get("CORS_ORIGINS", "*").split(",")),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers: password, jwt, ids
# ---------------------------------------------------------------------------
def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, kind: str = "access") -> str:
    delta = timedelta(minutes=ACCESS_MIN) if kind == "access" else timedelta(days=REFRESH_DAYS)
    payload = {"sub": user_id, "type": kind, "exp": datetime.now(timezone.utc) + delta, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", text.lower()).strip()
    s = re.sub(r"[\s_-]+", "-", s)
    return s or new_id()[:8]


def sanitize_user(u: Dict[str, Any]) -> Dict[str, Any]:
    if not u:
        return u
    u = {**u}
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u


# ---------------------------------------------------------------------------
# Event hooks — email + payment (MOCKED, ready for real integration later)
# ---------------------------------------------------------------------------
class EmailService:
    """Mock email service. Logs to console. Swap `send` with a real provider."""

    templates = {
        "welcome": "Welcome to PrintForge, {name}! Your account is ready.",
        "verify_email": "Verify your email: {link}",
        "reset_password": "Reset your password: {link}",
        "order_confirmation": "Order #{order_no} confirmed. Total ₹{total}.",
        "order_status": "Your order #{order_no} is now {status}.",
        "invoice": "Invoice for order #{order_no} attached.",
        "support_reply": "Support update on ticket #{ticket_id}: {message}",
        "newsletter": "Thanks for subscribing to PrintForge!",
    }

    @staticmethod
    async def send(to: str, template: str, ctx: Dict[str, Any]) -> None:
        body = EmailService.templates.get(template, "PrintForge notification")
        try:
            body = body.format(**ctx)
        except Exception:
            pass
        logger.info(f"[EMAIL:mock] to={to} template={template} body={body}")
        await db.email_log.insert_one({
            "id": new_id(), "to": to, "template": template, "body": body,
            "context": ctx, "created_at": now_iso(),
        })


class WhatsAppService:
    """Placeholder — real Twilio/Meta integration goes here."""

    @staticmethod
    async def send(to: str, template: str, ctx: Dict[str, Any]) -> None:
        logger.info(f"[WHATSAPP:mock] to={to} template={template} ctx={ctx}")


class PaymentService:
    """Mock payment gateway. Marks payments as paid instantly (except COD)."""

    @staticmethod
    async def charge(order_id: str, method: str, amount: float) -> Dict[str, Any]:
        # Real integration would call Stripe/Razorpay here.
        txn_id = f"MOCK-{new_id()[:8].upper()}"
        status_ = "pending" if method == "cod" else "paid"
        payment = {
            "id": new_id(),
            "order_id": order_id,
            "method": method,
            "amount": amount,
            "status": status_,
            "transaction_id": txn_id,
            "created_at": now_iso(),
        }
        await db.payments.insert_one(payment)
        return payment


async def dispatch_order_event(order: Dict[str, Any], event: str) -> None:
    """Central hook for status transitions -> email + whatsapp + notification."""
    user = await db.users.find_one({"id": order["user_id"]})
    if not user:
        return
    ctx = {"order_no": order["order_no"], "status": event, "total": order["total"], "name": user.get("name", "there")}
    await EmailService.send(user["email"], "order_status", ctx)
    await WhatsAppService.send(user.get("phone", ""), "order_status", ctx)
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "title": f"Order {order['order_no']} — {event}",
        "message": f"Your order status is now {event}.",
        "kind": "order",
        "ref_id": order["id"],
        "read": False,
        "created_at": now_iso(),
    })


# ---------------------------------------------------------------------------
# Auth models & endpoints
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


def set_auth_cookies(response: Response, user_id: str) -> Dict[str, str]:
    access = create_token(user_id, "access")
    refresh = create_token(user_id, "refresh")
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=ACCESS_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=REFRESH_DAYS * 86400, path="/")
    return {"access_token": access, "refresh_token": refresh}


async def get_user_from_token(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        return user
    except jwt.PyJWTError:
        return None


async def require_user(request: Request) -> Dict[str, Any]:
    user = await get_user_from_token(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return sanitize_user(user)


async def require_admin(request: Request) -> Dict[str, Any]:
    user = await require_user(request)
    if user.get("role") not in ("admin", "staff"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = new_id()
    doc = {
        "id": uid,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "phone": payload.phone,
        "role": "customer",
        "avatar_url": None,
        "email_verified": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    set_auth_cookies(response, uid)
    await EmailService.send(email, "welcome", {"name": doc["name"]})
    return sanitize_user(doc)


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    set_auth_cookies(response, user["id"])
    return sanitize_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(require_user)):
    return user


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        set_auth_cookies(response, payload["sub"])
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({
            "id": new_id(), "token": token, "user_id": user["id"],
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "used": False, "created_at": now_iso(),
        })
        await EmailService.send(user["email"], "reset_password", {"link": f"/reset-password?token={token}"})
    return {"ok": True, "message": "If that email exists, a reset link was sent."}


@api.post("/auth/reset-password")
async def reset_password(payload: ResetIn):
    doc = await db.password_resets.find_one({"token": payload.token, "used": False})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid or used token")
    if datetime.fromisoformat(doc["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one({"id": doc["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.password_resets.update_one({"id": doc["id"]}, {"$set": {"used": True}})
    return {"ok": True}


@api.patch("/auth/profile")
async def update_profile(payload: ProfileUpdate, user=Depends(require_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    new_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return sanitize_user(new_user)


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
CATEGORY_DEFS = [
    ("Kitchen", "kitchen", "utensils", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"),
    ("Home Utility", "home-utility", "home", "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800"),
    ("Office", "office", "briefcase", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
    ("Education", "education", "graduation-cap", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"),
    ("Farming", "farming", "sprout", "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"),
    ("Decoration", "decoration", "sparkles", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800"),
    ("Religious", "religious", "hand-heart", "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"),
    ("Automotive", "automotive", "car", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"),
    ("Mobile Accessories", "mobile-accessories", "smartphone", "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800"),
    ("Gaming", "gaming", "gamepad-2", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"),
    ("Gifts", "gifts", "gift", "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800"),
    ("Custom Prints", "custom-prints", "wand-2", "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800"),
    ("Accessories", "accessories", "package", "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800"),
]


@api.get("/categories")
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return cats


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class ProductVariant(BaseModel):
    name: str
    color: Optional[str] = None
    price_delta: float = 0


class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    short_description: str = ""
    category_slug: str
    price: float
    discount_price: Optional[float] = None
    stock: int = 0
    material: str = "PLA"
    weight_g: Optional[float] = None
    dimensions: Optional[str] = None
    print_time_hours: Optional[float] = None
    color_variants: List[str] = []
    images: List[str] = []
    tags: List[str] = []
    featured: bool = False
    is_active: bool = True
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    material: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = None,
    limit: int = Query(60, le=200),
    skip: int = 0,
):
    query: Dict[str, Any] = {"is_active": True}
    if category:
        query["category_slug"] = category
    if material:
        query["material"] = material
    if featured is not None:
        query["featured"] = featured
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$in": [q.lower()]}},
        ]
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("rating_avg", -1)],
        "popular": [("orders_count", -1)],
    }
    cursor = db.products.find(query, {"_id": 0})
    if sort in sort_map:
        cursor = cursor.sort(sort_map[sort])
    else:
        cursor = cursor.sort([("created_at", -1)])
    items = await cursor.skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    return {"items": items, "total": total}


@api.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"$or": [{"slug": slug}, {"id": slug}]}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    reviews = await db.reviews.find({"product_id": p["id"], "approved": True}, {"_id": 0}).sort("created_at", -1).to_list(50)
    related = await db.products.find(
        {"category_slug": p["category_slug"], "id": {"$ne": p["id"]}, "is_active": True}, {"_id": 0}
    ).limit(6).to_list(6)
    return {"product": p, "reviews": reviews, "related": related}


@api.post("/products")
async def create_product(payload: ProductIn, user=Depends(require_admin)):
    data = payload.model_dump()
    data["id"] = new_id()
    data["slug"] = data.get("slug") or slugify(data["name"])
    if await db.products.find_one({"slug": data["slug"]}):
        data["slug"] = f"{data['slug']}-{new_id()[:6]}"
    data["rating_avg"] = 0
    data["rating_count"] = 0
    data["orders_count"] = 0
    data["created_at"] = now_iso()
    data["updated_at"] = now_iso()
    await db.products.insert_one(data)
    await log_activity(user, "product.create", data["id"], {"name": data["name"]})
    data.pop("_id", None)
    return data


@api.patch("/products/{pid}")
async def update_product(pid: str, payload: Dict[str, Any], user=Depends(require_admin)):
    payload["updated_at"] = now_iso()
    await db.products.update_one({"id": pid}, {"$set": payload})
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    await log_activity(user, "product.update", pid, {"name": p.get("name")})
    return p


@api.delete("/products/{pid}")
async def delete_product(pid: str, user=Depends(require_admin)):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    await db.products.delete_one({"id": pid})
    await log_activity(user, "product.delete", pid, {"name": p.get("name") if p else None})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    title: str
    comment: str


@api.post("/reviews")
async def create_review(payload: ReviewIn, user=Depends(require_user)):
    doc = payload.model_dump()
    doc.update({
        "id": new_id(),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "approved": True,
        "created_at": now_iso(),
    })
    await db.reviews.insert_one(doc)
    # recompute product rating
    reviews = await db.reviews.find({"product_id": payload.product_id, "approved": True}).to_list(1000)
    avg = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one({"id": payload.product_id}, {"$set": {"rating_avg": round(avg, 2), "rating_count": len(reviews)}})
    doc.pop("_id", None)
    return doc


@api.get("/reviews", dependencies=[Depends(require_admin)])
async def admin_list_reviews():
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)


@api.patch("/reviews/{rid}")
async def moderate_review(rid: str, payload: Dict[str, Any], user=Depends(require_admin)):
    await db.reviews.update_one({"id": rid}, {"$set": payload})
    await log_activity(user, "review.moderate", rid, payload)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------
@api.get("/wishlist")
async def get_wishlist(user=Depends(require_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    pids = [i["product_id"] for i in items]
    products = await db.products.find({"id": {"$in": pids}}, {"_id": 0}).to_list(200) if pids else []
    return products


@api.post("/wishlist/{pid}")
async def add_wishlist(pid: str, user=Depends(require_user)):
    if not await db.wishlist.find_one({"user_id": user["id"], "product_id": pid}):
        await db.wishlist.insert_one({"id": new_id(), "user_id": user["id"], "product_id": pid, "created_at": now_iso()})
    return {"ok": True}


@api.delete("/wishlist/{pid}")
async def remove_wishlist(pid: str, user=Depends(require_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "product_id": pid})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Addresses
# ---------------------------------------------------------------------------
class AddressIn(BaseModel):
    label: str = "Home"
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False


@api.get("/addresses")
async def list_addresses(user=Depends(require_user)):
    return await db.addresses.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)


@api.post("/addresses")
async def create_address(payload: AddressIn, user=Depends(require_user)):
    doc = payload.model_dump()
    doc.update({"id": new_id(), "user_id": user["id"], "created_at": now_iso()})
    if doc["is_default"]:
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/addresses/{aid}")
async def update_address(aid: str, payload: Dict[str, Any], user=Depends(require_user)):
    if payload.get("is_default"):
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.update_one({"id": aid, "user_id": user["id"]}, {"$set": payload})
    return {"ok": True}


@api.delete("/addresses/{aid}")
async def delete_address(aid: str, user=Depends(require_user)):
    await db.addresses.delete_one({"id": aid, "user_id": user["id"]})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------
class CouponIn(BaseModel):
    code: str
    kind: Literal["percent", "flat"] = "percent"
    value: float
    min_order: float = 0
    max_discount: Optional[float] = None
    is_active: bool = True
    expires_at: Optional[str] = None


@api.get("/coupons/validate")
async def validate_coupon(code: str, subtotal: float):
    c = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid coupon")
    if c.get("expires_at") and datetime.fromisoformat(c["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Coupon expired")
    if subtotal < c.get("min_order", 0):
        raise HTTPException(400, f"Minimum order ₹{c['min_order']} required")
    if c["kind"] == "percent":
        discount = subtotal * (c["value"] / 100)
        if c.get("max_discount"):
            discount = min(discount, c["max_discount"])
    else:
        discount = c["value"]
    return {"coupon": c, "discount": round(discount, 2)}


@api.get("/coupons", dependencies=[Depends(require_admin)])
async def list_coupons():
    return await db.coupons.find({}, {"_id": 0}).sort("code", 1).to_list(200)


@api.post("/coupons", dependencies=[Depends(require_admin)])
async def create_coupon(payload: CouponIn):
    doc = payload.model_dump()
    doc["code"] = doc["code"].upper().strip()
    doc.update({"id": new_id(), "created_at": now_iso()})
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/coupons/{cid}", dependencies=[Depends(require_admin)])
async def delete_coupon(cid: str):
    await db.coupons.delete_one({"id": cid})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
ORDER_STATUSES = [
    "placed", "payment_received", "accepted", "printing_scheduled",
    "printing_started", "quality_inspection", "packed", "shipped",
    "out_for_delivery", "delivered", "completed", "cancelled",
]


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    variant: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    address_id: str
    payment_method: Literal["upi", "card", "netbanking", "cod"]
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


def compute_order_totals(items: List[Dict[str, Any]], discount: float = 0) -> Dict[str, float]:
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    shipping = 0 if subtotal >= 999 else 79
    gst = round((subtotal - discount) * 0.18, 2)
    total = round(subtotal - discount + gst + shipping, 2)
    return {"subtotal": round(subtotal, 2), "shipping": shipping, "gst": gst, "discount": round(discount, 2), "total": total}


@api.post("/orders")
async def create_order(payload: OrderCreate, user=Depends(require_user)):
    if not payload.items:
        raise HTTPException(400, "Empty order")
    address = await db.addresses.find_one({"id": payload.address_id, "user_id": user["id"]}, {"_id": 0})
    if not address:
        raise HTTPException(400, "Address not found")

    line_items = []
    for it in payload.items:
        p = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(400, f"Product {it.product_id} not found")
        if p["stock"] < it.quantity:
            raise HTTPException(400, f"Insufficient stock for {p['name']}")
        line_items.append({
            "product_id": p["id"],
            "name": p["name"],
            "image": (p.get("images") or [None])[0],
            "slug": p["slug"],
            "price": p.get("discount_price") or p["price"],
            "quantity": it.quantity,
            "variant": it.variant,
        })

    discount = 0
    coupon = None
    if payload.coupon_code:
        try:
            r = await validate_coupon(payload.coupon_code, sum(i["price"] * i["quantity"] for i in line_items))
            discount = r["discount"]
            coupon = r["coupon"]["code"]
        except HTTPException:
            pass

    totals = compute_order_totals(line_items, discount)
    order_id = new_id()
    order_no = "PF-" + datetime.now(timezone.utc).strftime("%y%m%d") + "-" + new_id()[:5].upper()
    timeline = [{"status": "placed", "at": now_iso(), "note": "Order placed"}]
    order = {
        "id": order_id,
        "order_no": order_no,
        "user_id": user["id"],
        "user_email": user["email"],
        "items": line_items,
        "address": address,
        "payment_method": payload.payment_method,
        "coupon_code": coupon,
        **totals,
        "status": "placed",
        "timeline": timeline,
        "notes": payload.notes,
        "priority": "normal",
        "printer_id": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order)

    # Deduct stock
    for it in line_items:
        await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -it["quantity"], "orders_count": it["quantity"]}})

    # Process (mock) payment
    payment = await PaymentService.charge(order_id, payload.payment_method, totals["total"])
    if payment["status"] == "paid":
        order = await _advance_status(order_id, "payment_received", note=f"Payment via {payload.payment_method}")

    await EmailService.send(user["email"], "order_confirmation", {"order_no": order_no, "total": totals["total"]})
    order.pop("_id", None)
    return order


async def _advance_status(order_id: str, new_status: str, note: str = "") -> Dict[str, Any]:
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(404, "Order not found")
    entry = {"status": new_status, "at": now_iso(), "note": note}
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": new_status, "updated_at": now_iso()}, "$push": {"timeline": entry}},
    )
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    await dispatch_order_event(order, new_status)
    return order


@api.get("/orders")
async def my_orders(user=Depends(require_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.get("/orders/{oid}")
async def get_order(oid: str, user=Depends(require_user)):
    q = {"id": oid}
    if user["role"] == "customer":
        q["user_id"] = user["id"]
    o = await db.orders.find_one(q, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    return o


@api.get("/admin/orders", dependencies=[Depends(require_admin)])
async def admin_orders(status_: Optional[str] = Query(None, alias="status"), q: Optional[str] = None, limit: int = 100):
    query: Dict[str, Any] = {}
    if status_:
        query["status"] = status_
    if q:
        query["$or"] = [{"order_no": {"$regex": q, "$options": "i"}}, {"user_email": {"$regex": q, "$options": "i"}}]
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)


@api.patch("/admin/orders/{oid}/status")
async def admin_update_status(oid: str, payload: Dict[str, Any], user=Depends(require_admin)):
    if payload.get("status") not in ORDER_STATUSES:
        raise HTTPException(400, "Invalid status")
    order = await _advance_status(oid, payload["status"], payload.get("note", ""))
    if payload["status"] == "cancelled":
        for it in order["items"]:
            await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": it["quantity"]}})
    await log_activity(user, "order.status", oid, {"order_no": order.get("order_no"), "status": payload["status"]})
    return order


@api.patch("/admin/orders/{oid}", dependencies=[Depends(require_admin)])
async def admin_update_order(oid: str, payload: Dict[str, Any]):
    allowed = {"priority", "printer_id", "notes"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    updates["updated_at"] = now_iso()
    await db.orders.update_one({"id": oid}, {"$set": updates})
    return await db.orders.find_one({"id": oid}, {"_id": 0})


# ---------------------------------------------------------------------------
# Inventory & Printers
# ---------------------------------------------------------------------------
class InventoryIn(BaseModel):
    name: str
    kind: Literal["filament", "packaging", "tool", "consumable"] = "filament"
    material: Optional[str] = None
    color: Optional[str] = None
    quantity: float
    unit: str = "kg"
    reorder_level: float = 0
    unit_cost: float = 0
    supplier: Optional[str] = None


@api.get("/inventory", dependencies=[Depends(require_admin)])
async def list_inventory():
    return await db.inventory.find({}, {"_id": 0}).sort("name", 1).to_list(500)


@api.post("/inventory", dependencies=[Depends(require_admin)])
async def create_inventory(payload: InventoryIn):
    doc = payload.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso(), "updated_at": now_iso()})
    await db.inventory.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/inventory/{iid}", dependencies=[Depends(require_admin)])
async def update_inventory(iid: str, payload: Dict[str, Any]):
    payload["updated_at"] = now_iso()
    await db.inventory.update_one({"id": iid}, {"$set": payload})
    return await db.inventory.find_one({"id": iid}, {"_id": 0})


@api.delete("/inventory/{iid}", dependencies=[Depends(require_admin)])
async def delete_inventory(iid: str):
    await db.inventory.delete_one({"id": iid})
    return {"ok": True}


class PrinterIn(BaseModel):
    name: str
    model: str
    status: Literal["idle", "printing", "paused", "maintenance", "offline"] = "idle"
    nozzle_size: str = "0.4mm"
    filament_loaded: Optional[str] = None
    current_job: Optional[str] = None
    total_hours: float = 0


@api.get("/printers", dependencies=[Depends(require_admin)])
async def list_printers():
    return await db.printers.find({}, {"_id": 0}).sort("name", 1).to_list(100)


@api.post("/printers", dependencies=[Depends(require_admin)])
async def create_printer(payload: PrinterIn):
    doc = payload.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso()})
    await db.printers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/printers/{pid}", dependencies=[Depends(require_admin)])
async def update_printer(pid: str, payload: Dict[str, Any]):
    await db.printers.update_one({"id": pid}, {"$set": payload})
    return await db.printers.find_one({"id": pid}, {"_id": 0})


@api.delete("/printers/{pid}", dependencies=[Depends(require_admin)])
async def delete_printer(pid: str):
    await db.printers.delete_one({"id": pid})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Customers, Support, Notifications, Blog
# ---------------------------------------------------------------------------
@api.get("/admin/customers", dependencies=[Depends(require_admin)])
async def list_customers():
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for u in users:
        orders = await db.orders.find({"user_id": u["id"]}).to_list(500)
        u["lifetime_spend"] = round(sum(o["total"] for o in orders), 2)
        u["orders_count"] = len(orders)
    return users


class TicketIn(BaseModel):
    subject: str
    message: str
    order_no: Optional[str] = None


class TicketReplyIn(BaseModel):
    message: str


@api.get("/support/tickets")
async def my_tickets(user=Depends(require_user)):
    return await db.tickets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/support/tickets")
async def create_ticket(payload: TicketIn, user=Depends(require_user)):
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user["email"],
        "subject": payload.subject,
        "order_no": payload.order_no,
        "status": "open",
        "messages": [{"from": "customer", "message": payload.message, "at": now_iso()}],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.tickets.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/support/tickets/{tid}/reply")
async def reply_ticket(tid: str, payload: TicketReplyIn, user=Depends(require_user)):
    t = await db.tickets.find_one({"id": tid})
    if not t:
        raise HTTPException(404, "Ticket not found")
    if user["role"] == "customer" and t["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    who = "admin" if user["role"] in ("admin", "staff") else "customer"
    await db.tickets.update_one(
        {"id": tid},
        {"$push": {"messages": {"from": who, "message": payload.message, "at": now_iso()}},
         "$set": {"updated_at": now_iso(), "status": "answered" if who == "admin" else "open"}},
    )
    if who == "admin":
        await EmailService.send(t["user_email"], "support_reply", {"ticket_id": tid, "message": payload.message})
    return await db.tickets.find_one({"id": tid}, {"_id": 0})


@api.get("/admin/tickets", dependencies=[Depends(require_admin)])
async def admin_tickets():
    return await db.tickets.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)


@api.patch("/admin/tickets/{tid}", dependencies=[Depends(require_admin)])
async def admin_update_ticket(tid: str, payload: Dict[str, Any]):
    await db.tickets.update_one({"id": tid}, {"$set": payload})
    return {"ok": True}


@api.get("/notifications")
async def my_notifications(user=Depends(require_user)):
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)


@api.post("/notifications/{nid}/read")
async def mark_notif(nid: str, user=Depends(require_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# Blog
class BlogPostIn(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: str = ""
    content: str
    cover_image: Optional[str] = None
    tags: List[str] = []
    is_published: bool = True


@api.get("/blog")
async def list_blog(limit: int = 20):
    return await db.blog.find({"is_published": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)


@api.get("/blog/{slug}")
async def get_blog(slug: str):
    b = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Not found")
    return b


@api.post("/blog", dependencies=[Depends(require_admin)])
async def create_blog(payload: BlogPostIn):
    d = payload.model_dump()
    d["slug"] = d.get("slug") or slugify(d["title"])
    d.update({"id": new_id(), "created_at": now_iso(), "updated_at": now_iso()})
    await db.blog.insert_one(d)
    d.pop("_id", None)
    return d


@api.patch("/blog/{bid}", dependencies=[Depends(require_admin)])
async def update_blog(bid: str, payload: Dict[str, Any]):
    payload["updated_at"] = now_iso()
    await db.blog.update_one({"id": bid}, {"$set": payload})
    return {"ok": True}


@api.delete("/blog/{bid}", dependencies=[Depends(require_admin)])
async def delete_blog(bid: str):
    await db.blog.delete_one({"id": bid})
    return {"ok": True}


# Newsletter / Contact
class NewsletterIn(BaseModel):
    email: EmailStr


@api.post("/newsletter")
async def newsletter(payload: NewsletterIn):
    await db.newsletter.update_one(
        {"email": payload.email.lower()},
        {"$setOnInsert": {"id": new_id(), "email": payload.email.lower(), "created_at": now_iso()}},
        upsert=True,
    )
    await EmailService.send(payload.email, "newsletter", {})
    return {"ok": True}


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@api.post("/contact")
async def contact(payload: ContactIn):
    doc = payload.model_dump()
    doc.update({"id": new_id(), "created_at": now_iso()})
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
@api.get("/admin/analytics/summary", dependencies=[Depends(require_admin)])
async def analytics_summary():
    today = datetime.now(timezone.utc).date().isoformat()
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(5000)
    today_orders = [o for o in all_orders if o["created_at"].startswith(today)]
    pending = [o for o in all_orders if o["status"] not in ("delivered", "completed", "cancelled")]
    revenue_by_day: Dict[str, float] = {}
    for o in all_orders:
        d = o["created_at"][:10]
        revenue_by_day[d] = revenue_by_day.get(d, 0) + o["total"]
    # top products
    counter: Dict[str, Dict[str, Any]] = {}
    for o in all_orders:
        for it in o["items"]:
            k = it["product_id"]
            if k not in counter:
                counter[k] = {"name": it["name"], "count": 0, "revenue": 0}
            counter[k]["count"] += it["quantity"]
            counter[k]["revenue"] += it["price"] * it["quantity"]
    top_products = sorted(counter.values(), key=lambda x: x["revenue"], reverse=True)[:8]

    printing_queue = await db.orders.count_documents({"status": {"$in": ["accepted", "printing_scheduled", "printing_started"]}})
    low_stock = await db.inventory.find({"$expr": {"$lte": ["$quantity", "$reorder_level"]}}, {"_id": 0}).to_list(50)
    customers_count = await db.users.count_documents({"role": "customer"})
    aov = round(sum(o["total"] for o in all_orders) / len(all_orders), 2) if all_orders else 0

    revenue_series = sorted(revenue_by_day.items())[-14:]
    return {
        "today_revenue": round(sum(o["total"] for o in today_orders), 2),
        "today_orders": len(today_orders),
        "pending_orders": len(pending),
        "printing_queue": printing_queue,
        "total_revenue": round(sum(o["total"] for o in all_orders), 2),
        "total_orders": len(all_orders),
        "customers_count": customers_count,
        "aov": aov,
        "revenue_series": [{"date": d, "revenue": round(v, 2)} for d, v in revenue_series],
        "top_products": top_products,
        "low_stock": low_stock,
        "recent_orders": all_orders[:8] if all_orders else [],
    }


# ---------------------------------------------------------------------------
# Activity logs
# ---------------------------------------------------------------------------
async def log_activity(user: Dict[str, Any], action: str, target: str, meta: Optional[Dict[str, Any]] = None) -> None:
    """Record an admin action to activity_logs."""
    if not user:
        return
    await db.activity_logs.insert_one({
        "id": new_id(),
        "user_id": user.get("id"),
        "user_email": user.get("email"),
        "user_name": user.get("name"),
        "action": action,
        "target": target,
        "meta": meta or {},
        "created_at": now_iso(),
    })


@api.get("/admin/activity-logs", dependencies=[Depends(require_admin)])
async def list_activity_logs(limit: int = Query(200, le=1000), action: Optional[str] = None):
    q: Dict[str, Any] = {}
    if action:
        q["action"] = action
    logs = await db.activity_logs.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs


# ---------------------------------------------------------------------------
# Media library (base64 stored in MongoDB — easy to swap for object storage later)
# ---------------------------------------------------------------------------
MAX_MEDIA_BYTES = 3 * 1024 * 1024  # 3 MB per image
ALLOWED_MEDIA_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"}


@api.get("/admin/media", dependencies=[Depends(require_admin)])
async def list_media(limit: int = 200):
    items = await db.media.find({}, {"_id": 0, "data": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return items


@api.get("/admin/media/{mid}")
async def get_media(mid: str):
    m = await db.media.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Not found")
    return Response(
        content=base64.b64decode(m["data"]),
        media_type=m["content_type"],
        headers={"Cache-Control": "public, max-age=31536000"},
    )


@api.post("/admin/media/upload")
async def upload_media(file: UploadFile = File(...), user=Depends(require_admin)):
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(400, f"Unsupported type: {file.content_type}")
    data = await file.read()
    if len(data) > MAX_MEDIA_BYTES:
        raise HTTPException(400, f"File too large (max {MAX_MEDIA_BYTES // 1024 // 1024} MB)")
    mid = new_id()
    doc = {
        "id": mid,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(data),
        "data": base64.b64encode(data).decode(),
        "created_at": now_iso(),
        "uploaded_by": user["email"],
    }
    await db.media.insert_one(doc)
    await log_activity(user, "media.upload", mid, {"filename": file.filename, "size": len(data)})
    return {"id": mid, "url": f"/api/admin/media/{mid}", "filename": file.filename, "size": len(data), "content_type": file.content_type}


@api.delete("/admin/media/{mid}")
async def delete_media(mid: str, user=Depends(require_admin)):
    await db.media.delete_one({"id": mid})
    await log_activity(user, "media.delete", mid)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Bulk product import / export
# ---------------------------------------------------------------------------
PRODUCT_CSV_FIELDS = [
    "name", "slug", "category_slug", "material", "price", "discount_price",
    "stock", "weight_g", "dimensions", "print_time_hours",
    "color_variants", "images", "tags", "featured", "is_active",
    "short_description", "description", "seo_title", "seo_description",
]


@api.get("/admin/products/export", dependencies=[Depends(require_admin)])
async def export_products():
    products = await db.products.find({}, {"_id": 0}).to_list(5000)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=PRODUCT_CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for p in products:
        row = {k: p.get(k) for k in PRODUCT_CSV_FIELDS}
        # serialize list fields
        for k in ("color_variants", "images", "tags"):
            v = row.get(k)
            if isinstance(v, list):
                row[k] = "|".join(str(x) for x in v)
        writer.writerow(row)
    csv_bytes = buf.getvalue().encode()
    filename = f"printforge-products-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _coerce(v: str, kind: str) -> Any:
    if v is None or v == "":
        return None
    if kind == "int":
        try: return int(float(v))
        except: return 0
    if kind == "float":
        try: return float(v)
        except: return None
    if kind == "bool":
        return str(v).strip().lower() in ("1", "true", "yes", "y")
    if kind == "list":
        return [x.strip() for x in str(v).split("|") if x.strip()]
    return str(v).strip()


@api.post("/admin/products/import")
async def import_products(file: UploadFile = File(...), user=Depends(require_admin)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "CSV file required")
    raw = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    created, updated, errors = 0, 0, []
    for i, row in enumerate(reader, start=2):
        try:
            name = (row.get("name") or "").strip()
            if not name:
                errors.append({"row": i, "error": "missing name"})
                continue
            slug = (row.get("slug") or "").strip() or slugify(name)
            existing = await db.products.find_one({"slug": slug})
            payload = {
                "name": name,
                "slug": slug,
                "category_slug": (row.get("category_slug") or "accessories").strip(),
                "material": (row.get("material") or "PLA").strip(),
                "price": _coerce(row.get("price"), "float") or 0,
                "discount_price": _coerce(row.get("discount_price"), "float"),
                "stock": _coerce(row.get("stock"), "int") or 0,
                "weight_g": _coerce(row.get("weight_g"), "float"),
                "dimensions": row.get("dimensions") or None,
                "print_time_hours": _coerce(row.get("print_time_hours"), "float"),
                "color_variants": _coerce(row.get("color_variants"), "list") or [],
                "images": _coerce(row.get("images"), "list") or [],
                "tags": _coerce(row.get("tags"), "list") or [],
                "featured": _coerce(row.get("featured"), "bool"),
                "is_active": _coerce(row.get("is_active"), "bool") if row.get("is_active") not in (None, "") else True,
                "short_description": row.get("short_description") or "",
                "description": row.get("description") or "",
                "seo_title": row.get("seo_title") or name,
                "seo_description": row.get("seo_description") or "",
                "updated_at": now_iso(),
            }
            if existing:
                await db.products.update_one({"id": existing["id"]}, {"$set": payload})
                updated += 1
            else:
                payload.update({
                    "id": new_id(),
                    "rating_avg": 0, "rating_count": 0, "orders_count": 0,
                    "created_at": now_iso(),
                })
                await db.products.insert_one(payload)
                created += 1
        except Exception as ex:
            errors.append({"row": i, "error": str(ex)})
    await log_activity(user, "products.import", "csv", {"created": created, "updated": updated, "errors": len(errors)})
    return {"created": created, "updated": updated, "errors": errors}


# Wrap key admin actions with activity logging (thin, non-invasive) — see log_activity() calls inline in create/update/delete handlers.




# ---------------------------------------------------------------------------
# Health & Root
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"name": "PrintForge API", "version": "1.0.0", "status": "ok"}


@api.get("/health")
async def health():
    return {"ok": True, "time": now_iso()}


app.include_router(api)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
PRODUCT_SEED = [
    # kitchen
    {"name": "Modular Spice Rack", "category_slug": "kitchen", "price": 899, "discount_price": 749, "material": "PLA", "color_variants": ["Black", "White", "Wood Brown"], "featured": True, "images": ["https://images.unsplash.com/photo-1590794056484-df8a1c3ba53f?w=900"], "short_description": "Stackable, wall-mountable 3D-printed spice organizer.", "print_time_hours": 6.5, "weight_g": 240, "dimensions": "30 × 12 × 8 cm"},
    {"name": "Herb Grinder Set", "category_slug": "kitchen", "price": 549, "material": "PETG", "color_variants": ["Charcoal", "Ivory"], "images": ["https://images.unsplash.com/photo-1556909024-f4a256a49a70?w=900"], "short_description": "Two-part precision herb grinder printed in food-safe PETG.", "print_time_hours": 3.2, "weight_g": 90},
    # home utility
    {"name": "Cable Management Loops (×20)", "category_slug": "home-utility", "price": 299, "material": "TPU", "color_variants": ["Black"], "featured": True, "images": ["https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=900"], "short_description": "Flexible TPU cable loops that stick to any surface.", "print_time_hours": 2.5, "weight_g": 45},
    {"name": "Under-Shelf Basket", "category_slug": "home-utility", "price": 1099, "material": "PLA", "images": ["https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=900"], "short_description": "Slide-under-shelf storage basket with modular clips.", "print_time_hours": 11, "weight_g": 380},
    # office
    {"name": "Ergonomic Laptop Riser", "category_slug": "office", "price": 1499, "discount_price": 1249, "material": "PETG", "color_variants": ["Graphite"], "featured": True, "images": ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900"], "short_description": "Angled riser for cooler, healthier posture.", "print_time_hours": 14, "weight_g": 620},
    {"name": "Desk Cable Tray", "category_slug": "office", "price": 799, "material": "PLA", "images": ["https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=900"], "short_description": "Clamp-on tray that hides cables under any desk.", "print_time_hours": 7, "weight_g": 260},
    # education
    {"name": "Anatomy Heart Model", "category_slug": "education", "price": 1899, "material": "Resin", "images": ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900"], "short_description": "Life-size anatomical heart cross-section.", "print_time_hours": 18, "weight_g": 400},
    # farming
    {"name": "Seedling Starter Cups (×12)", "category_slug": "farming", "price": 399, "material": "PLA", "color_variants": ["Terracotta", "Moss Green"], "images": ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900"], "short_description": "Compostable 3D-printed cups for germinating seeds.", "print_time_hours": 4, "weight_g": 120},
    # decoration
    {"name": "Voronoi Vase — Large", "category_slug": "decoration", "price": 1299, "material": "PLA", "color_variants": ["Sand", "Onyx"], "featured": True, "images": ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900"], "short_description": "Organic parametric vase with layered light play.", "print_time_hours": 10, "weight_g": 340},
    # religious
    {"name": "Buddha Meditation Statue", "category_slug": "religious", "price": 1499, "material": "Resin", "images": ["https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900"], "short_description": "Serene desktop Buddha printed in high-detail resin.", "print_time_hours": 9, "weight_g": 220},
    # automotive
    {"name": "Phone Dash Mount", "category_slug": "automotive", "price": 649, "material": "PETG", "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900"], "short_description": "Universal magnetic dash mount, custom-fit brackets on request.", "print_time_hours": 5, "weight_g": 130},
    # mobile accessories
    {"name": "MagSafe Wallet Stand", "category_slug": "mobile-accessories", "price": 799, "material": "PETG", "featured": True, "images": ["https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=900"], "short_description": "Slim card holder + kickstand for MagSafe iPhones.", "print_time_hours": 4, "weight_g": 60},
    # gaming
    {"name": "Controller Wall Mount (Pair)", "category_slug": "gaming", "price": 899, "material": "PLA", "images": ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900"], "short_description": "Discreet wall hooks for PS/Xbox controllers.", "print_time_hours": 5, "weight_g": 180},
    {"name": "Dice Tower — Dungeon Edition", "category_slug": "gaming", "price": 1799, "material": "PLA", "images": ["https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=900"], "short_description": "Cinematic dice tower with rolling ramps.", "print_time_hours": 22, "weight_g": 540},
    # gifts
    {"name": "Personalized Name Plaque", "category_slug": "gifts", "price": 599, "material": "PLA", "images": ["https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=900"], "short_description": "Custom typography name plaque — pick font + color.", "print_time_hours": 3, "weight_g": 100},
    # custom prints
    {"name": "Send Us Your STL — Custom Print", "category_slug": "custom-prints", "price": 199, "material": "PLA", "featured": True, "images": ["https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=900"], "short_description": "Upload your STL — we'll price + print. Per-gram base rate.", "print_time_hours": 0},
    # accessories
    {"name": "Filament Spool Holder", "category_slug": "accessories", "price": 449, "material": "PLA", "images": ["https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=900"], "short_description": "Universal roller-bearing spool holder for any printer.", "print_time_hours": 6, "weight_g": 200},
]


BLOG_SEED = [
    {"title": "How 3D Printing Actually Works (in 90 seconds)", "excerpt": "FDM, resin, layer heights, adhesion — the mental model behind additive manufacturing.", "content": "3D printing builds objects one thin layer at a time...\n\nMost consumer prints use FDM (fused deposition modeling) where a heated nozzle extrudes plastic. Resin printers cure liquid photopolymer with UV light for higher detail.", "cover_image": "https://images.unsplash.com/photo-1638959492386-f9a68d55c374?w=1200", "tags": ["basics", "guide"]},
    {"title": "Choosing the Right Filament: PLA vs PETG vs ABS", "excerpt": "Which plastic should you order? A field guide.", "content": "PLA is the friendliest — biodegradable, low-warp, great colors...\n\nPETG is tougher, more heat-resistant, and safe for food-contact.\n\nABS is industrial but needs a heated enclosure.", "cover_image": "https://images.unsplash.com/photo-1633504110842-7618144066fd?w=1200", "tags": ["materials"]},
    {"title": "From Idea to Delivery: Inside a PrintForge Order", "excerpt": "A behind-the-scenes look at the 10-stage journey.", "content": "Every order flows through the same 10 checkpoints — placed, accepted, scheduled, printed, inspected, packed, shipped, delivered.", "cover_image": "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=1200", "tags": ["behind-the-scenes"]},
]


COUPON_SEED = [
    {"code": "WELCOME10", "kind": "percent", "value": 10, "min_order": 499, "max_discount": 300, "is_active": True},
    {"code": "FREESHIP", "kind": "flat", "value": 79, "min_order": 299, "is_active": True},
]


PRINTER_SEED = [
    {"name": "Prometheus-01", "model": "Bambu Lab X1C", "status": "printing", "nozzle_size": "0.4mm", "filament_loaded": "PLA — Onyx", "current_job": "Voronoi Vase", "total_hours": 1240},
    {"name": "Prometheus-02", "model": "Bambu Lab X1C", "status": "idle", "nozzle_size": "0.4mm", "filament_loaded": "PETG — Graphite", "total_hours": 980},
    {"name": "Athena-01", "model": "Prusa MK4", "status": "maintenance", "nozzle_size": "0.6mm", "filament_loaded": None, "total_hours": 2100},
    {"name": "Helios-01", "model": "Elegoo Saturn 3", "status": "printing", "nozzle_size": "N/A (Resin)", "filament_loaded": "Grey Resin", "current_job": "Anatomy Heart", "total_hours": 640},
]


INVENTORY_SEED = [
    {"name": "PLA — Onyx Black", "kind": "filament", "material": "PLA", "color": "Black", "quantity": 12.5, "unit": "kg", "reorder_level": 3, "unit_cost": 1400, "supplier": "eSun"},
    {"name": "PLA — Ivory White", "kind": "filament", "material": "PLA", "color": "White", "quantity": 8, "unit": "kg", "reorder_level": 3, "unit_cost": 1400},
    {"name": "PETG — Graphite", "kind": "filament", "material": "PETG", "color": "Grey", "quantity": 2.2, "unit": "kg", "reorder_level": 3, "unit_cost": 1700},
    {"name": "TPU — Jet Black", "kind": "filament", "material": "TPU", "color": "Black", "quantity": 4, "unit": "kg", "reorder_level": 2, "unit_cost": 2200},
    {"name": "Resin — Standard Grey", "kind": "filament", "material": "Resin", "color": "Grey", "quantity": 6, "unit": "L", "reorder_level": 2, "unit_cost": 2800},
    {"name": "Shipping Boxes — Medium", "kind": "packaging", "quantity": 240, "unit": "pcs", "reorder_level": 100, "unit_cost": 12},
    {"name": "Bubble Wrap Roll", "kind": "packaging", "quantity": 4, "unit": "rolls", "reorder_level": 2, "unit_cost": 350},
    {"name": "0.4mm Brass Nozzles", "kind": "tool", "quantity": 18, "unit": "pcs", "reorder_level": 6, "unit_cost": 90},
]


async def seed_data():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.orders.create_index("order_no", unique=True)

    # categories
    if await db.categories.count_documents({}) == 0:
        cats = [{"id": new_id(), "name": n, "slug": s, "icon": ic, "image": img} for (n, s, ic, img) in CATEGORY_DEFS]
        await db.categories.insert_many(cats)

    # admin
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(), "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "PrintForge Admin", "phone": None, "role": "admin",
            "avatar_url": None, "email_verified": True, "created_at": now_iso(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # demo customer
    cust_email = os.environ["DEMO_CUSTOMER_EMAIL"]
    cust_password = os.environ["DEMO_CUSTOMER_PASSWORD"]
    if not await db.users.find_one({"email": cust_email}):
        await db.users.insert_one({
            "id": new_id(), "email": cust_email, "password_hash": hash_password(cust_password),
            "name": "Priya Sharma", "phone": "+91 9876543210", "role": "customer",
            "avatar_url": None, "email_verified": True, "created_at": now_iso(),
        })

    # products
    if await db.products.count_documents({}) == 0:
        for p in PRODUCT_SEED:
            doc = {
                "id": new_id(),
                "name": p["name"],
                "slug": slugify(p["name"]),
                "description": (p.get("short_description") or "") + "\n\nCrafted layer-by-layer at our studio using calibrated printers and premium filament. Every print is inspected before it ships.",
                "short_description": p.get("short_description", ""),
                "category_slug": p["category_slug"],
                "price": p["price"],
                "discount_price": p.get("discount_price"),
                "stock": 25,
                "material": p.get("material", "PLA"),
                "weight_g": p.get("weight_g"),
                "dimensions": p.get("dimensions"),
                "print_time_hours": p.get("print_time_hours"),
                "color_variants": p.get("color_variants", []),
                "images": p.get("images", []),
                "tags": [],
                "featured": p.get("featured", False),
                "is_active": True,
                "seo_title": p["name"],
                "seo_description": p.get("short_description", ""),
                "rating_avg": 0,
                "rating_count": 0,
                "orders_count": 0,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
            await db.products.insert_one(doc)

    # blog
    if await db.blog.count_documents({}) == 0:
        for b in BLOG_SEED:
            await db.blog.insert_one({
                "id": new_id(), "slug": slugify(b["title"]),
                "title": b["title"], "excerpt": b["excerpt"], "content": b["content"],
                "cover_image": b.get("cover_image"), "tags": b.get("tags", []),
                "is_published": True, "created_at": now_iso(), "updated_at": now_iso(),
            })

    # coupons
    if await db.coupons.count_documents({}) == 0:
        for c in COUPON_SEED:
            await db.coupons.insert_one({**c, "id": new_id(), "created_at": now_iso()})

    # printers
    if await db.printers.count_documents({}) == 0:
        for p in PRINTER_SEED:
            await db.printers.insert_one({**p, "id": new_id(), "created_at": now_iso()})

    # inventory
    if await db.inventory.count_documents({}) == 0:
        for i in INVENTORY_SEED:
            await db.inventory.insert_one({**i, "id": new_id(), "created_at": now_iso(), "updated_at": now_iso()})

    logger.info("Seed complete")


@app.on_event("startup")
async def on_startup():
    await seed_data()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
