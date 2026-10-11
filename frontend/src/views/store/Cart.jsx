import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import GetCurrentAddress from "../plugin/UserCountry";
import { showToast } from "../../utils/toast";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../plugin/Context";
import { CartItemSkeleton, SummarySkeleton } from "../components/Skeleton";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Mail,
  User,
  Phone,
  Tag,
  Lock,
  Heart,
  CheckCircle2,
} from "lucide-react";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState({});
  const [productQuantity, setProductQuantity] = useState({});
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);


  const userData = UserData();
  const cart_id = CardID();
  const currentAddress = GetCurrentAddress();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("United States");

  const navigate = useNavigate();
  const cartContextVal = useContext(CartContext);
  const setCartCount = useMemo(
    () => (Array.isArray(cartContextVal) ? cartContextVal[1] : () => { }),
    [cartContextVal]
  );

  // Auto-fill address & profile if available
  useEffect(() => {
    if (userData?.full_name) setFullName(userData.full_name);
    if (userData?.email) setEmail(userData.email);
    if (currentAddress && typeof currentAddress === "object") {
      if (currentAddress.country) setCountry(currentAddress.country);
      if (currentAddress.city) setCity(currentAddress.city);
      if (currentAddress.state) setState(currentAddress.state);
    }
  }, [currentAddress, userData]);

  // Fetch cart items
  const fetchCartData = useCallback(async () => {
    if (!cart_id) return;
    const url = userData?.user_id
      ? `/cart-list/${cart_id}/${userData.user_id}/`
      : `/cart-list/${cart_id}/`;

    try {
      const res = await apiInstance.get(url);
      const items = Array.isArray(res.data) ? res.data : [];
      setCart(items);
      setCartCount(items.length);

      const qtyMap = {};
      items.forEach((c) => {
        if (c?.product?.id) {
          qtyMap[c.product.id] = c.quantity;
        }
      });
      setProductQuantity(qtyMap);
    } catch (err) {
      console.warn("Cart fetch skipped:", err?.message);
    }
  }, [cart_id, userData?.user_id, setCartCount]);

  // Fetch cart totals
  const fetchCartTotal = useCallback(async () => {
    if (!cart_id) return;
    const url = userData?.user_id
      ? `/cart-detail/${cart_id}/${userData.user_id}/`
      : `/cart-detail/${cart_id}/`;

    try {
      const res = await apiInstance.get(url);
      setCartTotal(res.data || {});
    } catch (err) {
      console.warn("Cart total fetch skipped:", err?.message);
    }
  }, [cart_id, userData?.user_id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchCartData(), fetchCartTotal()]).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [fetchCartData, fetchCartTotal]);

  // Update item quantity
  const handleUpdateQuantity = async (product, newQty) => {
    if (newQty < 1) return;
    const productId = product.id;

    // Optimistic local update
    setProductQuantity((prev) => ({ ...prev, [productId]: newQty }));

    try {
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("user_id", userData?.user_id || 0);
      formData.append("quantity", newQty);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount || 0);
      formData.append(
        "country",
        typeof currentAddress === "object"
          ? currentAddress.country || "United States"
          : currentAddress || "United States"
      );
      formData.append(
        "size",
        product.size?.length > 0 ? product.size[0].name : "No Size"
      );
      formData.append(
        "color",
        product.color?.length > 0 ? product.color[0].name : "No Color"
      );
      formData.append("cart_id", cart_id);

      await apiInstance.post("cart-view/", formData);
      await Promise.all([fetchCartData(), fetchCartTotal()]);
    } catch (_err) {
      showToast.error("Failed to update item quantity");
      fetchCartData();
    }
  };

  // Delete cart item
  const handleDeleteCartItem = async (itemId) => {
    const url = userData?.user_id
      ? `cart-delete/${cart_id}/${itemId}/${userData.user_id}/`
      : `cart-delete/${cart_id}/${itemId}/`;

    try {
      await apiInstance.delete(url);
      showToast.info("Item removed from cart");
      await Promise.all([fetchCartData(), fetchCartTotal()]);
    } catch (_err) {
      showToast.error("Could not remove item");
    }
  };


  // Create Order & Checkout
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !mobile || !address || !city) {
      showToast.warning("Please fill out all required shipping fields");
      return;
    }

    if (cart.length === 0) {
      showToast.warning("Your cart is empty");
      return;
    }

    setCreatingOrder(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("mobile", mobile);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("country", country);
      formData.append("cart_id", cart_id);
      formData.append("user_id", userData?.user_id || 0);

      const res = await apiInstance.post("create-order/", formData);

      if (res.data?.order_oid) {
        showToast.success("Order created! Directing to secure checkout...");
        navigate(`/checkout/${res.data.order_oid}/`);
      } else {
        throw new Error("Order creation failed");
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to proceed to checkout. Please try again."
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  const subTotal = Number(cartTotal.sub_total || 0);
  const shippingTotal = Number(cartTotal.shipping || 0);
  const taxTotal = Number(cartTotal.tax || 0);
  const finalTotal = Number(cartTotal.total || (subTotal + shippingTotal + taxTotal));

  // Free shipping threshold logic ($99)
  const freeShippingThreshold = 99;
  const progressPercent = Math.min(100, Math.round((subTotal / freeShippingThreshold) * 100));

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-12 2xl:px-16 max-w-screen-4k mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> Modern Cart
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Review Your Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {cart.length} item{cart.length !== 1 ? "s" : ""} saved with verified real-time stock
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 text-decoration-none"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <CartItemSkeleton key={n} />
            ))}
          </div>
          <div className="lg:col-span-4">
            <SummarySkeleton />
          </div>
        </div>
      ) : cart.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover thousands of designer products with instant checkout and fast worldwide express shipping.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 text-decoration-none transition-all hover:scale-[1.02]"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: CART ITEMS & SHIPPING FORM */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Progress Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  {subTotal >= freeShippingThreshold ? (
                    <span className="text-emerald-600">
                      🎉 Congratulations! You unlocked FREE Prime Express Shipping!
                    </span>
                  ) : (
                    <span>
                      Add ${(freeShippingThreshold - subTotal).toFixed(2)} more for <strong>FREE Express Shipping</strong>
                    </span>
                  )}
                </span>
                <span className="text-indigo-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Cart Items ({cart.length})
                </h2>
                <span className="text-xs text-slate-400">Price & Subtotal</span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((c) => {
                  const p = c.product;
                  const qty = productQuantity[p?.id] || c.quantity;
                  const itemPrice = Number(c.price || p?.price || 0);
                  const itemSubtotal = (itemPrice * qty).toFixed(2);

                  return (
                    <div
                      key={c.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      {/* Image & Details */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 group-hover:border-indigo-300 transition-colors">
                          <Link to={`/detail/${p?.slug}/`}>
                            <ImageWithFallback
                              src={p?.image}
                              alt={p?.title || "Item"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                        </div>

                        <div className="space-y-1 max-w-md">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {p?.category?.title || "Product"}
                          </span>
                          <Link
                            to={`/detail/${p?.slug}/`}
                            className="text-decoration-none"
                          >
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {p?.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                            {c.size && c.size !== "No Size" && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                                Size: {c.size}
                              </span>
                            )}
                            {c.color && c.color !== "No Color" && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                                Color: {c.color}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-700 pt-1">
                            ${itemPrice.toFixed(2)} each
                          </div>
                        </div>
                      </div>

                      {/* Stepper, Subtotal, Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p, qty - 1)}
                            disabled={qty <= 1}
                            className="p-1 hover:text-indigo-600 disabled:opacity-30 rounded transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p, qty + 1)}
                            className="p-1 hover:text-indigo-600 rounded transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[70px]">
                          <span className="text-sm font-black text-slate-900 block">
                            ${itemSubtotal}
                          </span>
                          <span className="text-[10px] text-slate-400">Total</span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCartItem(c.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Shipping Form */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" /> Shipping & Dispatch Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Required for automated tax invoice generation and live shipping dispatch notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123 Luxury Ave, Suite 400"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">State / Province</label>
                  <input
                    type="text"
                    placeholder="NY"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY & CHECKOUT */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            {/* Promo Code Notice */}
            <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-4 flex items-start gap-3">
              <Tag className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-indigo-950">Have a promo code?</span> You can apply store coupons directly during Checkout before making payment.
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">${subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-slate-900">
                    {shippingTotal === 0 ? (
                      <span className="text-emerald-600 font-extrabold uppercase">FREE</span>
                    ) : (
                      `$${shippingTotal.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-bold text-slate-900">${taxTotal.toFixed(2)}</span>
                </div>



                <div className="border-t border-slate-200/80 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-slate-900">Total Due</span>
                  <span className="text-2xl font-black text-indigo-600">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={creatingOrder || cart.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01]"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {creatingOrder ? "Creating Order..." : "Proceed to Secure Stripe Checkout"}
                </span>
              </button>

              {/* Trust Badges */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>256-Bit SSL Encrypted Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-500" />
                  <span>Real-time dispatch tracking included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>Stripe Verified Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
