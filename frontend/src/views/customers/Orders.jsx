import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import { OrderRowSkeleton } from "../components/Skeleton";
import { downloadInvoice } from "../../utils/invoice";
import {
  Package,
  Clock,
  CheckCircle2,
  Eye,
  ShoppingBag,
  ArrowRight,
  Truck,
  MapPin,
  Download,
  X,
  FileText,
  ShieldCheck,
  Calendar,
  Navigation,
} from "lucide-react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
  const userData = UserData();

  useEffect(() => {
    if (!userData?.user_id) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);

    apiInstance
      .get(`customer/orders/${userData.user_id}/`)
      .then((res) => {
        if (isMounted) {
          setOrders(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Orders fetch error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userData?.user_id]);

  // Dynamic status counts
  const pendingOrders = orders.filter(
    (o) =>
      o.order_status?.toLowerCase().includes("pending") ||
      o.order_status?.toLowerCase().includes("processing")
  ).length;

  const fulfilledOrders = orders.filter(
    (o) =>
      o.order_status?.toLowerCase().includes("delivered") ||
      o.order_status?.toLowerCase().includes("fulfilled")
  ).length;

  // Determine real-time tracking step (1-5)
  const getTrackingStep = (order) => {
    const status = (order?.order_status || "").toLowerCase();
    const payment = (order?.payment_status || "").toLowerCase();

    if (status.includes("delivered") || status.includes("fulfilled")) return 5;
    if (status.includes("out for delivery")) return 4;
    if (status.includes("shipped") || status.includes("transit")) return 3;
    if (payment === "paid" || status.includes("processing")) return 2;
    return 1;
  };

  const trackingStages = [
    {
      step: 1,
      title: "Order Placed",
      desc: "Order confirmed & received",
    },
    {
      step: 2,
      title: "Processing",
      desc: "Quality inspection & packing",
    },
    {
      step: 3,
      title: "In Transit",
      desc: "Dispatched with carrier hub",
    },
    {
      step: 4,
      title: "Out for Delivery",
      desc: "Courier en route to address",
    },
    {
      step: 5,
      title: "Delivered",
      desc: "Package safely handed over",
    },
  ];

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Sidebar />

        <div className="flex-1 w-full space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {orders.length}
                </h3>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">In Transit / Pending</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {pendingOrders}
                </h3>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Completed / Delivered</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {fulfilledOrders}
                </h3>
              </div>
            </div>
          </div>

          {/* Orders Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Orders & Transactions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track delivery progress in real time, review items, and download official invoices.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
                {orders.length} Orders Found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <>
                      <OrderRowSkeleton />
                      <OrderRowSkeleton />
                      <OrderRowSkeleton />
                    </>
                  ) : !userData?.user_id ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-slate-800">
                          Please Log In
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                          Log in to your LuxeStore account to view your purchase history and live shipment tracking.
                        </p>
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold text-decoration-none shadow-sm hover:bg-indigo-700"
                        >
                          Sign In Now <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-slate-800">
                          No orders placed yet
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                          Browse our store and make your first luxury purchase!
                        </p>
                        <Link
                          to="/"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold text-decoration-none shadow-sm hover:bg-indigo-700"
                        >
                          Shop Now <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const isPaid =
                        o.payment_status?.toLowerCase() === "paid";
                      return (
                        <tr
                          key={o.oid}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">
                              #{o.oid}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {moment(o.date).format("MMM DD, YYYY")}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {o.payment_status}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                              {o.order_status || "Pending"}
                            </span>
                          </td>

                          <td className="p-4 font-bold text-slate-900">
                            ${Number(o.total).toFixed(2)}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Real-time Order Tracking Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedTrackOrder(o)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                              >
                                <Truck className="w-3.5 h-3.5" /> Track Live
                              </button>

                              {/* Download Invoice Button */}
                              <button
                                type="button"
                                onClick={() => downloadInvoice(o)}
                                title="Download Official Invoice"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Invoice
                              </button>

                              {/* Order Detail Link */}
                              <Link
                                to={`/checkout/${o.oid}/`}
                                title="View Checkout Details"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Order Tracking Modal */}
      {selectedTrackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Dispatch Monitoring
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Track Order #{selectedTrackOrder.oid}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {moment(selectedTrackOrder.date).format("MMMM Do, YYYY [at] h:mm A")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrackOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carrier & Live Location Badge Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Carrier & Service:</span>
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-400" /> DHL Express Worldwide Priority
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 text-[11px] block">Waybill / Tracking No:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    LX-{selectedTrackOrder.oid.toUpperCase()}-EXP
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>
                    Current Location:{" "}
                    <strong className="text-emerald-300">
                      Central Sorting Facility, {selectedTrackOrder.city || "Regional Hub"}
                    </strong>
                  </span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  Estimated Delivery: <strong>Within 24–48 Hours</strong>
                </div>
              </div>
            </div>

            {/* Live Visual Stepper Tracker */}
            <div className="py-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Shipment Journey Timeline
              </h4>

              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 -z-0 hidden sm:block" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-indigo-600 -z-0 transition-all duration-500 hidden sm:block"
                  style={{
                    width: `${Math.min(
                      100,
                      ((getTrackingStep(selectedTrackOrder) - 1) / 4) * 100
                    )}%`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {trackingStages.map((stage) => {
                    const currentStep = getTrackingStep(selectedTrackOrder);
                    const isDone = stage.step <= currentStep;
                    const isCurrent = stage.step === currentStep;

                    return (
                      <div
                        key={stage.step}
                        className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all font-bold text-xs ${
                            isDone
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-indigo-50"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          } ${isCurrent ? "ring-4 ring-indigo-200 animate-pulse" : ""}`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            stage.step
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isDone ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {stage.title}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {stage.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Destination Address & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Destination Address
                </div>
                <p className="font-bold text-slate-900">{selectedTrackOrder.full_name}</p>
                <p className="text-slate-600">{selectedTrackOrder.address}</p>
                <p className="text-slate-600">
                  {selectedTrackOrder.city}, {selectedTrackOrder.state}{" "}
                  {selectedTrackOrder.country}
                </p>
                <p className="text-slate-500 font-mono text-[11px] pt-1">
                  Recipient Contact: {selectedTrackOrder.mobile}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Payment & Guarantee
                </div>
                <p className="text-slate-600">
                  Status:{" "}
                  <strong className="text-emerald-600 uppercase">
                    {selectedTrackOrder.payment_status}
                  </strong>
                </p>
                <p className="text-slate-600">
                  Total Paid:{" "}
                  <strong className="text-slate-900">
                    ${Number(selectedTrackOrder.total).toFixed(2)}
                  </strong>
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  100% Insured Delivery with contactless handover.
                </p>
              </div>
            </div>

            {/* Package Contents List */}
            {selectedTrackOrder.orderitem?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Items in this Shipment ({selectedTrackOrder.orderitem.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTrackOrder.orderitem.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.product?.title || "Product Item"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ""}{" "}
                            {item.color ? `| Color: ${item.color}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => downloadInvoice(selectedTrackOrder)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Official Invoice (PDF)
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrackOrder(null)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;