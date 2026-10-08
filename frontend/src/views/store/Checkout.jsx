import React, { useEffect, useState, useCallback } from "react";
import apiInstance from "../../utils/axios";
import { useParams } from "react-router-dom";
import { showToast } from "../../utils/toast";
import { SERVER_URL } from "../../utils/constants";
import { SummarySkeleton } from "../components/Skeleton";
import {
  CreditCard,
  Tag,
  ShieldCheck,
  MapPin,
  Mail,
  User,
  Phone,
  CheckCircle,
  Loader2,
} from "lucide-react";

const Checkout = () => {
  const [order, setOrder] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { order_oid } = useParams();

  const fetchOrderData = useCallback(async () => {
    try {
      const res = await apiInstance.get(`checkout/${order_oid}/`);
      setOrder(res.data || {});
    } catch (err) {
      console.error("Order fetch error:", err);
    }
  }, [order_oid]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchOrderData().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [fetchOrderData]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast.warning("Please enter a coupon code");
      return;
    }

    setApplyingCoupon(true);
    const formdata = new FormData();
    formdata.append("order_oid", order?.oid || order_oid);
    formdata.append("coupon_code", couponCode.trim());

    try {
      const response = await apiInstance.post("coupon/", formdata);
      await fetchOrderData();
      showToast.success(response.data.message || "Coupon applied successfully!");
      setCouponCode("");
    } catch (error) {
      console.error(error);
      showToast.error(
        error.response?.data?.message ||
        "Invalid or expired coupon code"
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePayWithStripe = (e) => {
    setPaymentLoading(true);
    // Submit the parent form containing the action
    const form = e.currentTarget.closest("form");
    if (form) {
      form.submit();
    }
  };

  // Safe server URL without duplicate trailing slash
  const stripeActionUrl = `${SERVER_URL.replace(
    /\/+$/,
    ""
  )}/api/v1/stripe-checkout/${order?.oid || order_oid}/`;

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
          <CheckCircle className="w-3.5 h-3.5" /> Order #{order?.oid || order_oid} Initialized
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Review & Complete Payment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify your shipping destination and complete payment securely via Stripe.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 h-80 skeleton-shimmer" />
          </div>
          <div className="lg:col-span-4">
            <SummarySkeleton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column: Order info & Items */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery address verification card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Confirmed Delivery Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Recipient Name
                  </label>
                  <input
                    type="text"
                    value={order?.full_name || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Contact Email
                  </label>
                  <input
                    type="email"
                    value={order?.email || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={order?.mobile || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={order?.address || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={order?.city || ""}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    State / Country
                  </label>
                  <input
                    type="text"
                    value={`${order?.state || ""}, ${order?.country || ""}`}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            {order?.orderitem?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Items In This Order ({order.orderitem.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {order.orderitem.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={item.product?.image}
                            alt={item.product?.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">
                            {item.product?.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Qty: {item.qty} | Price: ${item.price}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        ${item.sub_total || (Number(item.price) * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Stripe Payment */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5 sticky top-28">
              <h3 className="text-base font-bold text-slate-900">
                Payment Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ${Number(order?.sub_total || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Fee</span>
                  <span className="font-semibold text-slate-900">
                    ${Number(order?.tax_fee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Fee</span>
                  <span className="font-semibold text-slate-900">
                    ${Number(order?.service_fee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-900">
                    ${Number(order?.shipping_amount || 0).toFixed(2)}
                  </span>
                </div>

                {order?.saved && Number(order.saved) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                    <span>Discount Applied</span>
                    <span>-${Number(order.saved).toFixed(2)}</span>
                  </div>
                )}

                <hr className="border-slate-100 my-2" />

                <div className="flex justify-between text-sm items-baseline">
                  <span className="font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl font-black text-indigo-600">
                    ${Number(order?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stripe Payment Form */}
              <form action={stripeActionUrl} method="POST">
                <input
                  type="hidden"
                  name="frontend_url"
                  value={
                    typeof window !== "undefined" ? window.location.origin : ""
                  }
                />
                <button
                  type="button"
                  onClick={handlePayWithStripe}
                  disabled={paymentLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Redirecting to Stripe...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay With Stripe</span>
                    </>
                  )}
                </button>
              </form>

              {/* Coupon Section */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" /> Apply Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    {applyingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2 justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted 256-Bit SSL Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
