import { useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import Login from "./views/auth/Login";
import Register from "./views/auth/Register";
import Dashboard from "./views/auth/Dashboard";
import { useAuthStore } from "./store/auth";
import { useEffect } from "react";
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
import PrivateRoute from "./layout/PrivateRoute";
import MainWrapper from "./layout/MainWrapper";
import Orders from "./views/customers/Orders";


function App() {
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    hydrateUser(); // refresh হলে cookie থেকে user load হবে
  }, [hydrateUser]);

  const [count, setCount] = useState(0);
  const [cartCount, setCartCount] = useState();

  const cartId = CardID();
  const userData = UserData();

  useEffect(() => {
    const url = userData
      ? `/cart-list/${cartId}/${userData?.user_id}/`
      : `/cart-list/${cartId}/`;

    apiInstance.get(url).then((res) => {
      setCartCount(res.data.length);
    });
    console.log(cartCount);
  });

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <StoreHeader />

       
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-new-password" element={<CreatePassword />} />

          {/* Store Components */}

          <Route path="/" element={<Products />} />
          <Route path="/detail/:slug/" element={<ProductDetail />} />
          <Route path="/cart/" element={<Cart />} />
          <Route path="/checkout/:order_oid/" element={<Checkout />} />
          <Route
            path="/payment-success/:order_oid/"
            element={<PaymentSuccess />}
          />
          <Route path="/search/" element={<Search />} />

          {/* customers routes */}
          <Route
            path="/customer/account/"
            element={
              
              <Account />
              
            }
          />
            <Route path="/customer/orders/" element={<Orders />} />
        </Routes>
        
        <StoreFooter />
      </BrowserRouter>
    </CartContext.Provider>
  );
}

export default App;
