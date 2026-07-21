import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import StorefrontLayout from "@/components/layout/StorefrontLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getModuleForPath } from "@/views/AppPermissionRoutes";
import { setCurrentModuleId } from "@/common_assets/storage/CPStorage";

const Home = lazy(() => import("@/views/Home"));
const Products = lazy(() => import("@/views/Products"));
const ProductDetail = lazy(() => import("@/views/ProductDetail"));
const About = lazy(() => import("@/views/About"));
const Contact = lazy(() => import("@/views/Contact"));
const FAQ = lazy(() => import("@/views/FAQ"));
const Blog = lazy(() => import("@/views/Blog"));
const BlogPost = lazy(() => import("@/views/BlogPost"));
const Cart = lazy(() => import("@/views/Cart"));
const Checkout = lazy(() => import("@/views/Checkout"));
const PaymentPage = lazy(() => import("@/views/Payment"));
const Login = lazy(() => import("@/views/Login"));
const Register = lazy(() => import("@/views/Register"));
const ForgotPassword = lazy(() => import("@/views/ForgotPassword"));
const ResetPassword = lazy(() => import("@/views/ResetPassword"));
const NotFound = lazy(() => import("@/views/NotFound"));
const Privacy = lazy(() => import("@/views/policies/PrivacyPolicy"));
const Terms = lazy(() => import("@/views/policies/Terms"));
const Refund = lazy(() => import("@/views/policies/RefundPolicy"));
const Shipping = lazy(() => import("@/views/policies/ShippingPolicy"));

const CustomerDashboard = lazy(() => import("@/views/customer/Dashboard"));
const CustomerOrders = lazy(() => import("@/views/customer/Orders"));
const CustomerOrderDetail = lazy(() => import("@/views/customer/OrderDetail"));
const CustomerWishlist = lazy(() => import("@/views/customer/Wishlist"));
const CustomerProfile = lazy(() => import("@/views/customer/Profile"));
const CustomerSupport = lazy(() => import("@/views/customer/Support"));

const AdminDashboard = lazy(() => import("@/views/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/views/admin/Products"));
const AdminProductForm = lazy(() => import("@/views/admin/ProductForm"));
const AdminCategories = lazy(() => import("@/views/admin/Categories"));
const AdminOrders = lazy(() => import("@/views/admin/Orders"));
const AdminBilling = lazy(() => import("@/views/admin/Billing"));
const AdminOrderDetail = lazy(() => import("@/views/admin/OrderDetail"));
const AdminInventory = lazy(() => import("@/views/admin/Inventory"));
const AdminPrinters = lazy(() => import("@/views/admin/Printers"));
const AdminCustomers = lazy(() => import("@/views/admin/Customers"));
const AdminSupport = lazy(() => import("@/views/admin/Support"));
const AdminReviews = lazy(() => import("@/views/admin/Reviews"));
const AdminBlog = lazy(() => import("@/views/admin/Blog"));
const AdminCoupons = lazy(() => import("@/views/admin/Coupons"));
const AdminAnalytics = lazy(() => import("@/views/admin/Analytics"));
const AdminMedia = lazy(() => import("@/views/admin/Media"));
const AdminActivityLogs = lazy(() => import("@/views/admin/ActivityLogs"));
const AdminSettings = lazy(() => import("@/views/admin/Settings"));
const AdminPermissions = lazy(() => import("@/views/admin/Permissions"));
const AdminAccounts = lazy(() => import("@/views/admin/Accounts"));
const AdminPaymentConfiguration = lazy(() => import("@/views/admin/PaymentConfiguration"));
const AdminNotificationConfiguration = lazy(() => import("@/views/admin/NotificationConfiguration"));
const AdminApprovals = lazy(() => import("@/views/admin/Approvals"));

const B2bLanding = lazy(() => import("@/views/b2b/Landing"));
const B2bCatalog = lazy(() => import("@/views/b2b/Catalog"));
const B2bProductDetail = lazy(() => import("@/views/b2b/ProductDetail"));
const B2bQuoteRequest = lazy(() => import("@/views/b2b/QuoteRequest"));
const B2bDealerApply = lazy(() => import("@/views/b2b/DealerApply"));

const B2bAdminDashboard = lazy(() => import("@/views/admin/b2b/Dashboard"));
const B2bAdminCategories = lazy(() => import("@/views/admin/b2b/Categories"));
const B2bAdminProducts = lazy(() => import("@/views/admin/b2b/Products"));
const B2bAdminProductForm = lazy(() => import("@/views/admin/b2b/ProductForm"));
const B2bAdminCatalog = lazy(() => import("@/views/admin/b2b/CatalogGenerator"));
const B2bAdminQuotes = lazy(() => import("@/views/admin/b2b/Quotes"));
const B2bAdminDealers = lazy(() => import("@/views/admin/b2b/Dealers"));
const B2bAdminAnalytics = lazy(() => import("@/views/admin/b2b/Analytics"));
const B2bAdminSettings = lazy(() => import("@/views/admin/b2b/Settings"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" data-testid="page-loader">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" />
        <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" style={{ animationDelay: "0.2s" }} />
        <div className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

/** Sets moduleID header context on route change (CP xhr pattern). */
function ModuleRouteTracker() {
  const location = useLocation();
  useEffect(() => {
    const mod = getModuleForPath(location.pathname);
    setCurrentModuleId(mod?.moduleId || "");
  }, [location.pathname]);
  return null;
}

/** Redirects mistaken /products/{slug} URLs to /product/{slug}. */
function ProductSlugRedirect() {
  const { slug } = useParams();
  if (!slug || slug === "category") return <Navigate to="/404" replace />;
  return <Navigate to={`/product/${slug}`} replace />;
}

/** Scroll to top on every route change; disable browser scroll restoration. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ModuleRouteTracker />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Storefront */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/category/:slug" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductSlugRedirect />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/pay/:orderId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/refund-policy" element={<Refund />} />
                  <Route path="/shipping-policy" element={<Shipping />} />

                  {/* Customer */}
                  <Route path="/account" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/account/orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
                  <Route path="/account/orders/:id" element={<ProtectedRoute><CustomerOrderDetail /></ProtectedRoute>} />
                  <Route path="/account/wishlist" element={<ProtectedRoute><CustomerWishlist /></ProtectedRoute>} />
                  <Route path="/account/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
                  <Route path="/account/support" element={<ProtectedRoute><CustomerSupport /></ProtectedRoute>} />

                  {/* B2B public portal */}
                  <Route path="/b2b" element={<B2bLanding />} />
                  <Route path="/b2b/catalog" element={<B2bCatalog />} />
                  <Route path="/b2b/catalog/:categorySlug" element={<B2bCatalog />} />
                  <Route path="/b2b/product/:slug" element={<B2bProductDetail />} />
                  <Route path="/b2b/quote" element={<B2bQuoteRequest />} />
                  <Route path="/b2b/become-dealer" element={<B2bDealerApply />} />
                </Route>

                {/* Admin */}
                <Route element={<ProtectedRoute admin><AdminLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/products/new" element={<AdminProductForm />} />
                  <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/billing" element={<AdminBilling />} />
                  <Route path="/admin/approvals" element={<AdminApprovals />} />
                  <Route path="/admin/payment-configuration" element={<AdminPaymentConfiguration />} />
                  <Route path="/admin/notification-configuration" element={<AdminNotificationConfiguration />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                  <Route path="/admin/printers" element={<AdminPrinters />} />
                  <Route path="/admin/customers" element={<AdminCustomers />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/media" element={<AdminMedia />} />
                  <Route path="/admin/activity" element={<AdminActivityLogs />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/permissions" element={<AdminPermissions />} />
                  <Route path="/admin/accounts" element={<AdminAccounts />} />
                  <Route path="/admin/accounts/expenses" element={<AdminAccounts />} />
                  <Route path="/admin/accounts/income" element={<AdminAccounts />} />
                  <Route path="/admin/accounts/bills" element={<AdminAccounts />} />
                  <Route path="/admin/accounts/payments" element={<AdminAccounts />} />
                  <Route path="/admin/roles" element={<AdminPermissions />} />
                  <Route path="/admin/users" element={<AdminPermissions />} />

                  {/* B2B admin */}
                  <Route path="/admin/b2b" element={<B2bAdminDashboard />} />
                  <Route path="/admin/b2b/categories" element={<B2bAdminCategories />} />
                  <Route path="/admin/b2b/products" element={<B2bAdminProducts />} />
                  <Route path="/admin/b2b/products/new" element={<B2bAdminProductForm />} />
                  <Route path="/admin/b2b/products/:id/edit" element={<B2bAdminProductForm />} />
                  <Route path="/admin/b2b/catalog" element={<B2bAdminCatalog />} />
                  <Route path="/admin/b2b/quotes" element={<B2bAdminQuotes />} />
                  <Route path="/admin/b2b/dealers" element={<B2bAdminDealers />} />
                  <Route path="/admin/b2b/analytics" element={<B2bAdminAnalytics />} />
                  <Route path="/admin/b2b/settings" element={<B2bAdminSettings />} />
                </Route>

                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
