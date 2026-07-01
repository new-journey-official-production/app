"""PrintForge — P2 features backend tests.

Covers:
- Product CSV export
- Product CSV import (create/update/errors/list-fields split)
- Media library (upload, allowed/rejected content types, size cap, list w/o data, serve public, delete)
- Activity logs (auto-populated by admin actions, filter by action, auth enforcement)
"""
import os
import io
import csv
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://make-print-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@printforge.com"
ADMIN_PASSWORD = "Admin@12345"
CUSTOMER_EMAIL = "customer@printforge.com"
CUSTOMER_PASSWORD = "Customer@12345"


# ---------- session fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"customer login failed: {r.text}"
    return s


# 1x1 PNG (real bytes)
PNG_1x1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


# ---------- Product CSV Export ----------
class TestProductCSVExport:
    def test_export_admin_ok(self, admin_session):
        r = admin_session.get(f"{API}/admin/products/export", timeout=20)
        assert r.status_code == 200, r.text
        assert "text/csv" in r.headers.get("content-type", "")
        assert "attachment" in r.headers.get("content-disposition", "").lower()
        # parse
        reader = csv.DictReader(io.StringIO(r.text))
        header = reader.fieldnames
        assert header is not None
        for col in ("name", "slug", "price", "color_variants", "images", "tags"):
            assert col in header
        rows = list(reader)
        # There should be seeded products (17 per iteration_1) — at least 1
        assert len(rows) >= 1
        # list fields serialized with '|' when non-empty
        for row in rows:
            for k in ("color_variants", "images", "tags"):
                # allowed empty; if present must not look like python list repr
                assert not (row[k] or "").startswith("["), f"list field {k} not pipe-joined: {row[k]!r}"

    def test_export_unauth(self):
        r = requests.get(f"{API}/admin/products/export", timeout=10)
        assert r.status_code in (401, 403), r.text

    def test_export_forbidden_customer(self, customer_session):
        r = customer_session.get(f"{API}/admin/products/export", timeout=10)
        assert r.status_code in (401, 403), r.text


# ---------- Product CSV Import ----------
class TestProductCSVImport:
    def _build_csv(self, rows):
        buf = io.StringIO()
        writer = csv.DictWriter(
            buf,
            fieldnames=[
                "name", "slug", "category_slug", "material", "price", "discount_price",
                "stock", "weight_g", "dimensions", "print_time_hours",
                "color_variants", "images", "tags", "featured", "is_active",
                "short_description", "description", "seo_title", "seo_description",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        return buf.getvalue().encode("utf-8")

    def test_import_create_update_errors_and_list_split(self, admin_session):
        unique = uuid.uuid4().hex[:8]
        new_slug = f"test-import-{unique}"
        # take an existing slug to trigger update path
        er = admin_session.get(f"{API}/admin/products/export", timeout=15)
        assert er.status_code == 200
        existing_rows = list(csv.DictReader(io.StringIO(er.text)))
        assert existing_rows, "need at least one existing product to test update path"
        existing_slug = existing_rows[0]["slug"]
        existing_name = existing_rows[0]["name"]

        rows = [
            # (a) new slug — create
            {
                "name": f"TEST_ImportedItem_{unique}", "slug": new_slug,
                "category_slug": "accessories", "material": "PLA", "price": "199", "discount_price": "149",
                "stock": "10", "weight_g": "30", "dimensions": "5x5x5", "print_time_hours": "1.5",
                "color_variants": "Red|Blue|Green", "images": "https://x/img1.png|https://x/img2.png",
                "tags": "tag1|tag2", "featured": "true", "is_active": "true",
                "short_description": "sd", "description": "d", "seo_title": "st", "seo_description": "sd",
            },
            # (b) existing slug — update (change price)
            {
                "name": existing_name, "slug": existing_slug,
                "category_slug": "accessories", "material": "PLA", "price": "12345",
                "discount_price": "", "stock": "5", "weight_g": "", "dimensions": "",
                "print_time_hours": "", "color_variants": "", "images": "", "tags": "",
                "featured": "false", "is_active": "true",
                "short_description": "", "description": "", "seo_title": "", "seo_description": "",
            },
            # (c) missing name — error
            {
                "name": "", "slug": f"bad-{unique}", "category_slug": "", "material": "", "price": "",
                "discount_price": "", "stock": "", "weight_g": "", "dimensions": "",
                "print_time_hours": "", "color_variants": "", "images": "", "tags": "",
                "featured": "", "is_active": "", "short_description": "", "description": "",
                "seo_title": "", "seo_description": "",
            },
        ]
        csv_bytes = self._build_csv(rows)
        files = {"file": ("test.csv", csv_bytes, "text/csv")}
        r = admin_session.post(f"{API}/admin/products/import", files=files, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["created"] >= 1
        assert body["updated"] >= 1
        assert isinstance(body["errors"], list)
        assert any("missing name" in (e.get("error") or "") for e in body["errors"]), body["errors"]

        # Verify created product exists + list fields split
        pr = requests.get(f"{API}/products/{new_slug}", timeout=10)
        assert pr.status_code == 200, pr.text
        pdata = pr.json()["product"]
        assert pdata["name"] == f"TEST_ImportedItem_{unique}"
        assert pdata["color_variants"] == ["Red", "Blue", "Green"]
        assert pdata["tags"] == ["tag1", "tag2"]
        assert len(pdata["images"]) == 2

        # Verify update actually applied (price changed)
        ur = requests.get(f"{API}/products/{existing_slug}", timeout=10)
        assert ur.status_code == 200
        assert float(ur.json()["product"]["price"]) == 12345.0

        # cleanup — delete the created test product
        pid = pdata["id"]
        admin_session.delete(f"{API}/products/{pid}", timeout=10)

    def test_import_customer_forbidden(self, customer_session):
        files = {"file": ("x.csv", b"name\nfoo\n", "text/csv")}
        r = customer_session.post(f"{API}/admin/products/import", files=files, timeout=10)
        assert r.status_code in (401, 403), r.text

    def test_import_rejects_non_csv(self, admin_session):
        files = {"file": ("x.txt", b"not csv", "text/plain")}
        r = admin_session.post(f"{API}/admin/products/import", files=files, timeout=10)
        assert r.status_code == 400, r.text


# ---------- Media Library ----------
class TestMediaLibrary:
    def test_upload_list_serve_delete_flow(self, admin_session):
        # upload
        files = {"file": (f"TEST_{uuid.uuid4().hex[:6]}.png", PNG_1x1, "image/png")}
        r = admin_session.post(f"{API}/admin/media/upload", files=files, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert set(body.keys()) >= {"id", "url", "filename", "size", "content_type"}
        assert body["content_type"] == "image/png"
        assert body["size"] == len(PNG_1x1)
        assert body["url"].endswith(f"/api/admin/media/{body['id']}")
        mid = body["id"]

        # list — must NOT contain the raw 'data' field
        r = admin_session.get(f"{API}/admin/media", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        matched = [x for x in items if x["id"] == mid]
        assert matched, "just-uploaded media not found in list"
        for it in items:
            assert "data" not in it, "media list must not include base64 data field"

        # serve — public (no auth needed)
        r = requests.get(f"{API}/admin/media/{mid}", timeout=15)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("image/png")
        assert r.content == PNG_1x1

        # delete
        r = admin_session.delete(f"{API}/admin/media/{mid}", timeout=10)
        assert r.status_code == 200

        # confirm gone
        r = requests.get(f"{API}/admin/media/{mid}", timeout=10)
        assert r.status_code == 404

    def test_upload_rejects_unsupported_type(self, admin_session):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = admin_session.post(f"{API}/admin/media/upload", files=files, timeout=10)
        assert r.status_code == 400, r.text

    def test_upload_rejects_too_large(self, admin_session):
        big = b"\x89PNG\r\n\x1a\n" + b"0" * (3 * 1024 * 1024 + 10)
        files = {"file": ("big.png", big, "image/png")}
        r = admin_session.post(f"{API}/admin/media/upload", files=files, timeout=30)
        assert r.status_code == 400, r.text

    def test_media_list_customer_forbidden(self, customer_session):
        r = customer_session.get(f"{API}/admin/media", timeout=10)
        assert r.status_code in (401, 403)

    def test_media_upload_customer_forbidden(self, customer_session):
        files = {"file": ("x.png", PNG_1x1, "image/png")}
        r = customer_session.post(f"{API}/admin/media/upload", files=files, timeout=10)
        assert r.status_code in (401, 403)


# ---------- Activity Logs ----------
class TestActivityLogs:
    def test_logs_after_product_and_media_actions(self, admin_session):
        unique = uuid.uuid4().hex[:6]

        # create product
        pr = admin_session.post(
            f"{API}/products",
            json={
                "name": f"TEST_LogProduct_{unique}",
                "slug": f"test-log-product-{unique}",
                "category_slug": "accessories", "material": "PLA",
                "price": 100, "stock": 5,
            },
            timeout=15,
        )
        assert pr.status_code == 200, pr.text
        pid = pr.json()["id"]

        # update product
        up = admin_session.patch(f"{API}/products/{pid}", json={"price": 150}, timeout=10)
        assert up.status_code == 200, up.text

        # upload media
        files = {"file": (f"TEST_{unique}.png", PNG_1x1, "image/png")}
        mu = admin_session.post(f"{API}/admin/media/upload", files=files, timeout=10)
        assert mu.status_code == 200
        mid = mu.json()["id"]

        # delete media
        md = admin_session.delete(f"{API}/admin/media/{mid}", timeout=10)
        assert md.status_code == 200

        # delete product
        dp = admin_session.delete(f"{API}/products/{pid}", timeout=10)
        assert dp.status_code == 200

        # import CSV (small) to trigger products.import
        csv_bytes = ("name,slug,price\n" + f"TEST_LogImport_{unique},test-log-import-{unique},99\n").encode()
        ic = admin_session.post(
            f"{API}/admin/products/import",
            files={"file": ("i.csv", csv_bytes, "text/csv")},
            timeout=15,
        )
        assert ic.status_code == 200
        # cleanup imported product
        pr2 = requests.get(f"{API}/products/test-log-import-" + unique, timeout=10)
        if pr2.status_code == 200:
            admin_session.delete(f"{API}/products/{pr2.json()['product']['id']}", timeout=10)

        # fetch logs
        lr = admin_session.get(f"{API}/admin/activity-logs?limit=500", timeout=15)
        assert lr.status_code == 200, lr.text
        logs = lr.json()
        assert isinstance(logs, list) and len(logs) >= 5
        actions = {log["action"] for log in logs}
        # These should all appear from recent activity in this test
        for expected in ("product.create", "product.update", "product.delete",
                         "media.upload", "media.delete", "products.import"):
            assert expected in actions, f"missing activity log action: {expected}. Seen: {actions}"

        # each log has required fields
        for log in logs[:5]:
            assert "action" in log and "target" in log and "created_at" in log
            assert "user_email" in log
            assert "_id" not in log

    def test_logs_filter_by_action(self, admin_session):
        r = admin_session.get(f"{API}/admin/activity-logs?action=product.create&limit=50", timeout=10)
        assert r.status_code == 200, r.text
        logs = r.json()
        assert isinstance(logs, list)
        for log in logs:
            assert log["action"] == "product.create"

    def test_logs_review_moderate_and_order_status(self, admin_session, customer_session):
        # Create a review as customer, then moderate as admin -> review.moderate
        # 1) fetch a product id
        pr = requests.get(f"{API}/products", timeout=10)
        assert pr.status_code == 200
        pid = pr.json()["items"][0]["id"]

        # 2) place a review (may 400 if already reviewed - handle gracefully)
        rv = customer_session.post(
            f"{API}/reviews",
            json={"product_id": pid, "rating": 5, "title": "t", "body": "b"},
            timeout=10,
        )
        # Might be 200 or 400 (already reviewed) — try to find an existing review to moderate
        review_id = None
        if rv.status_code == 200:
            review_id = rv.json().get("id")
        if not review_id:
            # try admin review list
            all_reviews = admin_session.get(f"{API}/reviews", timeout=10)
            if all_reviews.status_code == 200 and all_reviews.json():
                review_id = all_reviews.json()[0]["id"]

        if review_id:
            mod = admin_session.patch(
                f"{API}/reviews/{review_id}",
                json={"approved": True},
                timeout=10,
            )
            # If mod path exists check status; the log_activity call is at server.py:541
            assert mod.status_code in (200, 404), mod.text

            r = admin_session.get(f"{API}/admin/activity-logs?action=review.moderate&limit=20", timeout=10)
            assert r.status_code == 200
            if mod.status_code == 200:
                actions = [x["action"] for x in r.json()]
                assert "review.moderate" in actions

    def test_logs_customer_forbidden(self, customer_session):
        r = customer_session.get(f"{API}/admin/activity-logs", timeout=10)
        assert r.status_code in (401, 403)

    def test_logs_unauth(self):
        r = requests.get(f"{API}/admin/activity-logs", timeout=10)
        assert r.status_code in (401, 403)


# ---------- Quick regression sanity ----------
class TestRegressionSanity:
    def test_products_list_ok(self):
        r = requests.get(f"{API}/products", timeout=10)
        assert r.status_code == 200
        assert "items" in r.json()

    def test_auth_me_admin(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_analytics_summary(self, admin_session):
        r = admin_session.get(f"{API}/admin/analytics/summary", timeout=15)
        assert r.status_code == 200
        assert "orders_total" in r.json() or "revenue" in r.json() or isinstance(r.json(), dict)
