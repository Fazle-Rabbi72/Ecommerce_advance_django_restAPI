import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import "./App.css";
import { useAuthStore } from "./store/auth";
import StoreHeader from "./views/base/StoreHeader";
import StoreFooter from "./views/base/StoreFooter";
import { CartContext } from "./views/plugin/Context";
import CardID from "./views/plugin/CardID";
import UserData from "./views/plugin/UserData";
import apiInstance from "./utils/axios";
import PrivateRoute from "./layout/PrivateRoute";
import VendorRoute from "./layout/VendorRoute";
import AdminRoute from "./layout/AdminRoute";
import MainWrapper from "./layout/MainWrapper";
import AIChatWidget from "./views/components/AIChatWidget";
import MobileBottomNav from "./views/components/MobileBottomNav";
import ScrollToTop from "./views/components/ScrollToTop";

// Route-level code splitting with React.lazy
const Products = lazy(() => import("./views/store/Products"));
const ProductDetail = lazy(() => import("./views/store/ProductDetail"));
const Cart = lazy(() => import("./views/store/Cart"));
const Checkout = lazy(() => import("./views/store/Checkout"));
const PaymentSuccess = lazy(() => import("./views/store/PaymentSuccess"));
const Search = lazy(() => import("./views/store/Search"));

const Login = lazy(() => import("./views/auth/Login"));
const Register = lazy(() => import("./views/auth/Register"));
const Dashboard = lazy(() => import("./views/auth/Dashboard"));
const Logout = lazy(() => import("./views/auth/Logout"));
const ForgotPassword = lazy(() => import("./views/auth/ForgotPassword"));
const CreatePassword = lazy(() => import("./views/auth/CreatePassword"));

const Account = lazy(() => import("./views/customers/Account"));
const Orders = lazy(() => import("./views/customers/Orders"));
const Wishlist = lazy(() => import("./views/customers/Wishlist"));

const VendorDashboard = lazy(() => import("./views/vendor/VendorDashboard"));
const VendorLogin = lazy(() => import("./views/vendor/VendorLogin"));
const VendorRegister = lazy(() => import("./views/vendor/VendorRegister"));

const AdminDashboard = lazy(() => import("./views/admin/AdminDashboard"));

const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
      Loading Axura...
    </span>
  </div>
);

function App() {
  const hydrateUser = useAuthStore((state) => state.hydrateUser);
  const [cartCount, setCartCount] = useState(0);

  const cartId = CardID();
  const userData = UserData();

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!cartId) return;
    const url = userData?.user_id
      ? `/cart-list/${cartId}/${userData.user_id}/`
      : `/cart-list/${cartId}/`;

    apiInstance
      .get(url)
      .then((res) => {
        setCartCount(Array.isArray(res.data) ? res.data.length : 0);
      })
      .catch((err) => {
        console.warn("Failed to retrieve initial cart count:", err?.message);
      });
  }, [cartId, userData?.user_id]);

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <ScrollToTop />
        <MainWrapper>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16 md:pb-0">
            <StoreHeader />

            <div className="flex-1">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Store Routes */}
                  <Route path="/" element={<Products />} />
                  <Route path="/detail/:slug/" element={<ProductDetail />} />
                  <Route path="/cart/" element={<Cart />} />
                  <Route
                    path="/checkout/:order_oid/"
                    element={
                      <PrivateRoute>
                        <Checkout />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/payment-success/:order_oid/"
                    element={
                      <PrivateRoute>
                        <PaymentSuccess />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/search/" element={<Search />} />
                  <Route path="/search" element={<Search />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/create-new-password" element={<CreatePassword />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* Customer Protected Routes */}
                  <Route
                    path="/customer/account/"
                    element={
                      <PrivateRoute>
                        <Account />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customer/account"
                    element={
                      <PrivateRoute>
                        <Account />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customer/orders/"
                    element={
                      <PrivateRoute>
                        <Orders />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customer/orders"
                    element={
                      <PrivateRoute>
                        <Orders />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customer/wishlist/"
                    element={
                      <PrivateRoute>
                        <Wishlist />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/customer/wishlist"
                    element={
                      <PrivateRoute>
                        <Wishlist />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/wishlist/"
                    element={
                      <PrivateRoute>
                        <Wishlist />
                      </PrivateRoute>
                    }
                  />

                  {/* Vendor / Seller Authentication & Registration Routes */}
                  <Route path="/vendor/login/" element={<VendorLogin />} />
                  <Route path="/vendor-login/" element={<VendorLogin />} />
                  <Route path="/vendor/register/" element={<VendorRegister />} />
                  <Route path="/vendor-register/" element={<VendorRegister />} />

                  {/* Vendor / Seller Dashboard Routes (Vendor Only) */}
                  <Route
                    path="/vendor/dashboard/"
                    element={
                      <VendorRoute>
                        <VendorDashboard />
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/vendor/dashboard"
                    element={
                      <VendorRoute>
                        <VendorDashboard />
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/vendor-dashboard/"
                    element={
                      <VendorRoute>
                        <VendorDashboard />
                      </VendorRoute>
                    }
                  />
                  <Route
                    path="/vendor-dashboard"
                    element={
                      <VendorRoute>
                        <VendorDashboard />
                      </VendorRoute>
                    }
                  />

                  {/* Admin Portal Route (Superuser Only) */}
                  <Route
                    path="/admin-dashboard/"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard/"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />

                  {/* 404 Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>

            <StoreFooter />
            <MobileBottomNav />
            <AIChatWidget />
          </div>
        </MainWrapper>
      </BrowserRouter>
    </CartContext.Provider>
  );
}

export default App;
