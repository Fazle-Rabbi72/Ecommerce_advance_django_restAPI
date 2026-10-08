import React, { useEffect, useRef, useState } from "react";
import apiInstance from "../../utils/axios";
import { useParams, Link } from "react-router-dom";
import { downloadInvoice } from "../../utils/invoice";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Package,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
  Download,
} from "lucide-react";

const PaymentSuccess = () => {
  const [order, setOrder] = useState({});
  const [status, setStatus] = useState("Verifying");
  const [showModal, setShowModal] = useState(false);
  const { order_oid } = useParams();

  const urlParam = new URLSearchParams(window.location.search);
  const sessionId = urlParam.get("session_id");

  const verified = useRef(false);

  // Load Order
  useEffect(() => {
    if (!order_oid) return;
    apiInstance
      .get(`checkout/${order_oid}/`)
      .then((res) => {
        const data = res.data || {};
        setOrder(data);
        if (data.payment_status?.toLowerCase() === "paid") {
          setStatus("Payment Successfull");
        }
      })
      .catch((err) => console.error("Order load error:", err));
  }, [order_oid]);

  // Verify Payment
  useEffect(() => {
    if (!order?.oid) return;
    if (order.payment_status?.toLowerCase() === "paid") {
      setStatus("Payment Successfull");
      return;
    }
    if (verified.current) return;
    verified.current = true;

    const formdata = new FormData();
    formdata.append("order_oid", order_oid);
    formdata.append("session_id", sessionId || "null");

    apiInstance
      .post(`payment-success/${order.oid}/`, formdata)
      .then((res) => {
        setStatus(res.data?.message || "Payment Successfull");
      })
      .catch(() => {
        if (order?.payment_status?.toLowerCase() === "paid") {
          setStatus("Payment Successfull");
        } else {
          setStatus("Your Invoice is Unpaid");
        }
      });
  }, [order, order_oid, sessionId]);

  const isSuccess =
    status === "Payment Successfull" ||
    status === "Payment Successful" ||
    status === "Already Paid";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Verifying State */}
      {status === "Verifying" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-14 text-center shadow-lg space-y-4">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Verifying Your Payment...
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please keep this window open while we securely verify your transaction with Stripe.
          </p>
        </div>
      )}

      {/* Success State */}
      {isSuccess && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-14 h-14" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Payment Completed
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              We received your payment for order{" "}
              <span className="font-bold text-slate-800">#{order.oid || order_oid}</span>.
              A confirmation email has been dispatched to{" "}
              <span className="font-bold text-slate-800">{order.email}</span>.
            </p>
          </div>

          {/* Quick Order Highlights Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-bold text-slate-800">#{order.oid || order_oid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-slate-800">${order.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-600">PAID & VERIFIED</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadInvoice(order)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Invoice (PDF)
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" /> View Invoice & Summary
            </button>

            <Link
              to="/customer/orders/"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 text-decoration-none transition-all"
            >
              <Package className="w-4 h-4" /> Track in Orders
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-decoration-none transition-all"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Unpaid / Failed State */}
      {status === "Your Invoice is Unpaid" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Payment Not Completed
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your payment could not be confirmed. If funds were deducted, they will automatically be reversed by your card issuer.
            </p>
          </div>
          <Link
            to={`/checkout/${order_oid}/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold text-decoration-none shadow-md"
          >
            Try Payment Again
          </Link>
        </div>
      )}

      {/* React Modal (Order Details & Invoice) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Invoice Summary
                </h3>
                <p className="text-xs text-slate-400">#{order.oid}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-900">{order.full_name}</p>
                <p className="text-slate-500">{order.email} | {order.mobile}</p>
                <p className="text-slate-500">{order.address}, {order.city}, {order.country}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.orderitem?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="font-medium text-slate-800 line-clamp-1 flex-1">
                      {item.product?.title}
                    </span>
                    <span className="font-bold text-slate-900 ml-2">
                      ${item.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${order.sub_total}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping</span>
                  <span>${order.shipping_amount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>${order.tax_fee}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service Fee</span>
                  <span>${order.service_fee}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Paid</span>
                  <span className="text-indigo-600">${order.total}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadInvoice(order)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
