import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import StorefrontLayout from "@/components/layout/StorefrontLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Privacy = lazy(() => import("@/pages/policies/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/policies/Terms"));
const Refund = lazy(() => import("@/pages/policies/RefundPolicy"));
const Shipping = lazy(() => import("@/pages/policies/ShippingPolicy"));

const CustomerDashboard = lazy(() => import("@/pages/customer/Dashboard"));
const CustomerOrders = lazy(() => import("@/pages/customer/Orders"));
const CustomerOrderDetail = lazy(() => import("@/pages/customer/OrderDetail"));
const CustomerWishlist = lazy(() => import("@/pages/customer/Wishlist"));
const CustomerProfile = lazy(() => import("@/pages/customer/Profile"));
const CustomerSupport = lazy(() => import("@/pages/customer/Support"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminPrinters = lazy(() => import("@/pages/admin/Printers"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminSupport = lazy(() => import("@/pages/admin/Support"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminBlog = lazy(() => import("@/pages/admin/Blog"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));

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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Storefront */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/category/:slug" element={<Products />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
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
                </Route>

                {/* Admin */}
                <Route element={<ProtectedRoute admin><AdminLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/products/new" element={<AdminProductForm />} />
                  <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                  <Route path="/admin/printers" element={<AdminPrinters />} />
                  <Route path="/admin/customers" element={<AdminCustomers />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/reviews" element={<AdminReviews />} />
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
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
