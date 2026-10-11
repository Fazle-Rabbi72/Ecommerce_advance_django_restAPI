import { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./views/auth/Login";
import Register from "./views/auth/Register";
import Dashboard from "./views/auth/Dashboard";
import { useAuthStore } from "./store/auth";
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreatePassword from "./views/auth/CreatePassword";
import StoreHeader from "./views/base/StoreHeader";
import StoreFooter from "./views/base/StoreFooter";
import Products from "./views/store/Products";
import ProductDetail from "./views/store/ProductDetail";
import Cart from "./views/store/Cart";
import Checkout from "./views/store/Checkout";
import PaymentSuccess from "./views/store/PaymentSuccess";
import Search from "./views/store/Search";
import { CartContext } from "./views/plugin/Context";
import CardID from "./views/plugin/CardID";
import UserData from "./views/plugin/UserData";
import apiInstance from "./utils/axios";
import Account from "./views/customers/Account";
import Orders from "./views/customers/Orders";
import Wishlist from "./views/customers/Wishlist";
import AdminDashboard from "./views/admin/AdminDashboard";
import VendorDashboard from "./views/vendor/VendorDashboard";
import VendorLogin from "./views/vendor/VendorLogin";
import VendorRegister from "./views/vendor/VendorRegister";
import PrivateRoute from "./layout/PrivateRoute";
import VendorRoute from "./layout/VendorRoute";
import AdminRoute from "./layout/AdminRoute";
import MainWrapper from "./layout/MainWrapper";
import AIChatWidget from "./views/components/AIChatWidget";

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
        <MainWrapper>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <StoreHeader />

            <div className="flex-1">
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
                  path="/customer/orders/"
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
            </div>

            <StoreFooter />
            <AIChatWidget />
          </div>
        </MainWrapper>
      </BrowserRouter>
    </CartContext.Provider>
  );
}

export default App;
