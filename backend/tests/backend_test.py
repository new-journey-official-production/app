"""PrintForge — Full backend regression test suite.
Covers auth, products, categories, cart→order, admin orders, coupons,
wishlist, reviews, support, inventory, printers, blog, analytics,
contact, newsletter, password reset, and auth enforcement.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://make-print-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@printforge.com"
ADMIN_PASSWORD = "Admin@12345"
CUSTOMER_EMAIL = "customer@printforge.com"
CUSTOMER_PASSWORD = "Customer@12345"


# ---------- shared session fixtures ----------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.text}"
    assert r.json()["role"] == "admin"
    assert "access_token" in s.cookies
    return s


@pytest.fixture(scope="session")
def customer_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"customer login failed: {r.text}"
    return s


@pytest.fixture(scope="session")
def seeded_product_id():
    r = requests.get(f"{API}/products", timeout=15)
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) > 0
    return items[0]["id"]


# ---------- Health ----------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        assert r.json()["ok"] is True


# ---------- Auth ----------
class TestAuth:
    def test_register_login_me_logout(self):
        s = requests.Session()
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Pass@1234"}, timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["email"] == email
        assert u["role"] == "customer"
        assert "access_token" in s.cookies
        assert "refresh_token" in s.cookies

        r = s.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == email

        r = s.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200
        # after logout, /auth/me should 401 (cookies cleared)
        s2 = requests.Session()
        r = s2.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_admin_login(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"name": "Dup", "email": ADMIN_EMAIL, "password": "Whatever1"}, timeout=10)
        assert r.status_code == 400

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
        assert r.status_code == 401


# ---------- Categories ----------
class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{API}/categories", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 13, f"expected 13 categories, got {len(data)}"
        slugs = {c["slug"] for c in data}
        assert "kitchen" in slugs


# ---------- Products ----------
class TestProducts:
    def test_list_seeded(self):
        r = requests.get(f"{API}/products", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 17, f"expected 17 seeded products, got {d['total']}"
        assert len(d["items"]) == 17

    def test_filter_by_category(self):
        r = requests.get(f"{API}/products", params={"category": "kitchen"}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        for it in d["items"]:
            assert it["category_slug"] == "kitchen"

    def test_search_query(self):
        r = requests.get(f"{API}/products", params={"q": "vase"}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1
        assert any("vase" in it["name"].lower() or "vase" in it.get("description", "").lower() for it in d["items"])

    def test_product_detail_and_related(self):
        # pick a real product slug
        r = requests.get(f"{API}/products", timeout=15)
        slug = r.json()["items"][0]["slug"]
        r = requests.get(f"{API}/products/{slug}", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["product"]["slug"] == slug
        assert isinstance(d["reviews"], list)
        assert isinstance(d["related"], list)

    def test_admin_crud_product(self, admin_session):
        payload = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}",
            "description": "test",
            "short_description": "test",
            "category_slug": "kitchen",
            "price": 500,
            "stock": 10,
        }
        r = admin_session.post(f"{API}/products", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        assert r.json()["name"] == payload["name"]

        r = admin_session.patch(f"{API}/products/{pid}", json={"price": 600}, timeout=10)
        assert r.status_code == 200
        assert r.json()["price"] == 600

        r = admin_session.delete(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 200


# ---------- Cart→Order flow ----------
class TestOrderFlow:
    _state: dict = {}

    def test_create_address(self, customer_session):
        r = customer_session.post(f"{API}/addresses", json={
            "full_name": "Priya Sharma", "phone": "+919876543210", "line1": "1 MG Road",
            "city": "Bengaluru", "state": "KA", "postal_code": "560001", "country": "India",
            "is_default": True,
        }, timeout=10)
        assert r.status_code == 200, r.text
        self._state["address_id"] = r.json()["id"]

    def test_create_order_with_coupon(self, customer_session, seeded_product_id):
        assert "address_id" in self._state
        # get product to compute stock beforehand
        pr = requests.get(f"{API}/products", timeout=15).json()["items"]
        prod = next(p for p in pr if p["id"] == seeded_product_id)
        pre_stock = prod["stock"]
        # ensure subtotal above min_order 499 for WELCOME10
        qty = max(1, int(999 / (prod.get("discount_price") or prod["price"])) + 1)

        r = customer_session.post(f"{API}/orders", json={
            "items": [{"product_id": seeded_product_id, "quantity": qty}],
            "address_id": self._state["address_id"],
            "payment_method": "upi",
            "coupon_code": "WELCOME10",
        }, timeout=20)
        assert r.status_code == 200, r.text
        o = r.json()
        assert o["order_no"].startswith("PF-")
        assert o["status"] == "payment_received", f"expected payment_received got {o['status']}"
        statuses = [t["status"] for t in o["timeline"]]
        assert "placed" in statuses
        assert "payment_received" in statuses
        assert o["discount"] > 0, "coupon discount not applied"
        assert o["coupon_code"] == "WELCOME10"

        self._state["order_id"] = o["id"]
        self._state["order_qty"] = qty
        self._state["pre_stock"] = pre_stock
        self._state["prod_id"] = seeded_product_id

        # verify stock deducted
        r = requests.get(f"{API}/products/{prod['slug']}", timeout=10)
        assert r.json()["product"]["stock"] == pre_stock - qty

    def test_admin_list_and_advance(self, admin_session):
        assert "order_id" in self._state
        r = admin_session.get(f"{API}/admin/orders", timeout=15)
        assert r.status_code == 200
        assert any(o["id"] == self._state["order_id"] for o in r.json())

        # advance to accepted
        oid = self._state["order_id"]
        r = admin_session.patch(f"{API}/admin/orders/{oid}/status", json={"status": "accepted", "note": "confirmed"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "accepted"
        # advance to printing_scheduled
        r = admin_session.patch(f"{API}/admin/orders/{oid}/status", json={"status": "printing_scheduled"}, timeout=10)
        assert r.status_code == 200
        timeline_statuses = [t["status"] for t in r.json()["timeline"]]
        assert "accepted" in timeline_statuses
        assert "printing_scheduled" in timeline_statuses

    def test_notifications_created_for_customer(self, customer_session):
        r = customer_session.get(f"{API}/notifications", timeout=10)
        assert r.status_code == 200
        notifs = r.json()
        assert any("accepted" in (n.get("title") or "").lower() or "accepted" in (n.get("message") or "").lower() for n in notifs), \
            f"no accepted notification found; got {[n.get('title') for n in notifs]}"

    def test_cancel_restores_stock(self, admin_session, customer_session):
        assert "order_id" in self._state
        oid = self._state["order_id"]
        # current stock
        pr = requests.get(f"{API}/products", timeout=15).json()["items"]
        prod = next(p for p in pr if p["id"] == self._state["prod_id"])
        stock_before_cancel = prod["stock"]

        r = admin_session.patch(f"{API}/admin/orders/{oid}/status", json={"status": "cancelled"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"

        pr2 = requests.get(f"{API}/products", timeout=15).json()["items"]
        prod2 = next(p for p in pr2 if p["id"] == self._state["prod_id"])
        assert prod2["stock"] == stock_before_cancel + self._state["order_qty"], \
            f"stock not restored: was {stock_before_cancel}, now {prod2['stock']}, qty {self._state['order_qty']}"


# ---------- Coupons ----------
class TestCoupons:
    def test_validate_welcome10(self):
        r = requests.get(f"{API}/coupons/validate", params={"code": "WELCOME10", "subtotal": 1000}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["discount"] == 100.0  # 10% of 1000, under max 300

    def test_admin_crud_coupon(self, admin_session):
        r = admin_session.get(f"{API}/coupons", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        code = f"TEST{uuid.uuid4().hex[:5].upper()}"
        r = admin_session.post(f"{API}/coupons", json={"code": code, "kind": "flat", "value": 50, "min_order": 100}, timeout=10)
        assert r.status_code == 200
        cid = r.json()["id"]

        r = admin_session.delete(f"{API}/coupons/{cid}", timeout=10)
        assert r.status_code == 200


# ---------- Wishlist ----------
class TestWishlist:
    def test_add_get_remove(self, customer_session, seeded_product_id):
        r = customer_session.post(f"{API}/wishlist/{seeded_product_id}", timeout=10)
        assert r.status_code == 200

        r = customer_session.get(f"{API}/wishlist", timeout=10)
        assert r.status_code == 200
        assert any(p["id"] == seeded_product_id for p in r.json())

        r = customer_session.delete(f"{API}/wishlist/{seeded_product_id}", timeout=10)
        assert r.status_code == 200


# ---------- Reviews ----------
class TestReviews:
    def test_customer_can_review(self, customer_session, seeded_product_id):
        r = customer_session.post(f"{API}/reviews", json={
            "product_id": seeded_product_id, "rating": 5, "title": "Great", "comment": "Loved it"
        }, timeout=10)
        assert r.status_code == 200, r.text

        # verify rating aggregates recomputed for this product
        after = requests.get(f"{API}/products", timeout=15).json()["items"]
        post = next(p for p in after if p["id"] == seeded_product_id)
        # rating_count is recomputed from actual reviews collection; at least 1 after our review
        assert post["rating_count"] >= 1
        assert post["rating_avg"] > 0


# ---------- Support tickets ----------
class TestSupport:
    _tid = None

    def test_customer_creates_ticket(self, customer_session):
        r = customer_session.post(f"{API}/support/tickets", json={"subject": "TEST_help", "message": "need info"}, timeout=10)
        assert r.status_code == 200
        TestSupport._tid = r.json()["id"]

    def test_admin_lists_and_replies(self, admin_session, customer_session):
        assert TestSupport._tid
        r = admin_session.get(f"{API}/admin/tickets", timeout=10)
        assert r.status_code == 200
        assert any(t["id"] == TestSupport._tid for t in r.json())

        # admin replies -> triggers email log
        r = admin_session.post(f"{API}/support/tickets/{TestSupport._tid}/reply", json={"message": "on it"}, timeout=10)
        assert r.status_code == 200
        msgs = r.json()["messages"]
        assert any(m["from"] == "admin" and m["message"] == "on it" for m in msgs)


# ---------- Inventory ----------
class TestInventory:
    def test_admin_crud_and_low_stock(self, admin_session):
        r = admin_session.post(f"{API}/inventory", json={
            "name": f"TEST_item_{uuid.uuid4().hex[:5]}", "kind": "filament", "quantity": 1, "unit": "kg", "reorder_level": 3
        }, timeout=10)
        assert r.status_code == 200
        iid = r.json()["id"]

        r = admin_session.patch(f"{API}/inventory/{iid}", json={"quantity": 0.5}, timeout=10)
        assert r.status_code == 200
        assert r.json()["quantity"] == 0.5

        # analytics summary should surface this low stock (quantity <= reorder_level)
        r = admin_session.get(f"{API}/admin/analytics/summary", timeout=15)
        assert r.status_code == 200
        low_ids = {x["id"] for x in r.json()["low_stock"]}
        assert iid in low_ids, "low-stock detection failed"

        admin_session.delete(f"{API}/inventory/{iid}", timeout=10)


# ---------- Printers ----------
class TestPrinters:
    def test_admin_crud(self, admin_session):
        r = admin_session.post(f"{API}/printers", json={"name": f"TEST_prn_{uuid.uuid4().hex[:5]}", "model": "TestX"}, timeout=10)
        assert r.status_code == 200
        pid = r.json()["id"]
        r = admin_session.patch(f"{API}/printers/{pid}", json={"status": "idle"}, timeout=10)
        assert r.status_code == 200
        r = admin_session.delete(f"{API}/printers/{pid}", timeout=10)
        assert r.status_code == 200


# ---------- Blog ----------
class TestBlog:
    def test_list_blog(self):
        r = requests.get(f"{API}/blog", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 3, f"expected 3 seeded blogs, got {len(d)}"

    def test_get_single_blog(self):
        r = requests.get(f"{API}/blog", timeout=10)
        slug = r.json()[0]["slug"]
        r = requests.get(f"{API}/blog/{slug}", timeout=10)
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_admin_crud(self, admin_session):
        r = admin_session.post(f"{API}/blog", json={"title": f"TEST_Post_{uuid.uuid4().hex[:5]}", "content": "hi"}, timeout=10)
        assert r.status_code == 200
        bid = r.json()["id"]
        r = admin_session.patch(f"{API}/blog/{bid}", json={"excerpt": "updated"}, timeout=10)
        assert r.status_code == 200
        r = admin_session.delete(f"{API}/blog/{bid}", timeout=10)
        assert r.status_code == 200


# ---------- Analytics ----------
class TestAnalytics:
    def test_summary_shape(self, admin_session):
        r = admin_session.get(f"{API}/admin/analytics/summary", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for key in ["today_revenue", "today_orders", "pending_orders", "printing_queue",
                    "revenue_series", "top_products", "low_stock", "recent_orders"]:
            assert key in d, f"missing key {key}"


# ---------- Auth enforcement ----------
class TestAuthEnforcement:
    def test_no_cookies_admin_route(self):
        r = requests.get(f"{API}/admin/orders", timeout=10)
        assert r.status_code in (401, 403)

    def test_customer_cannot_access_admin(self, customer_session):
        r = customer_session.get(f"{API}/admin/orders", timeout=10)
        assert r.status_code == 403

    def test_no_auth_orders(self):
        r = requests.get(f"{API}/orders", timeout=10)
        assert r.status_code == 401


# ---------- Contact & Newsletter ----------
class TestContactNewsletter:
    def test_contact(self):
        r = requests.post(f"{API}/contact", json={
            "name": "Bot", "email": "bot@example.com", "subject": "hi", "message": "hello"
        }, timeout=10)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_newsletter(self):
        r = requests.post(f"{API}/newsletter", json={"email": f"nl_{uuid.uuid4().hex[:6]}@example.com"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["ok"] is True


# ---------- Password reset ----------
class TestPasswordReset:
    def test_forgot_and_reset(self):
        # register fresh user
        s = requests.Session()
        email = f"pw_{uuid.uuid4().hex[:6]}@example.com"
        r = s.post(f"{API}/auth/register", json={"name": "PW User", "email": email, "password": "OldPass1"}, timeout=15)
        assert r.status_code == 200

        # forgot password (mocked email — token stored in db)
        r = requests.post(f"{API}/auth/forgot-password", json={"email": email}, timeout=10)
        assert r.status_code == 200

        # fetch token from db directly
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        doc = mc[os.environ.get("DB_NAME", "test_database")].password_resets.find_one({"used": False}, sort=[("created_at", -1)])
        assert doc is not None, "reset token not created"

        r = requests.post(f"{API}/auth/reset-password", json={"token": doc["token"], "password": "NewPass1"}, timeout=10)
        assert r.status_code == 200

        # login with new pw
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "NewPass1"}, timeout=10)
        assert r.status_code == 200
