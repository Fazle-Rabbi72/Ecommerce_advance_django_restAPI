import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import { OrderRowSkeleton } from "../components/Skeleton";
import { downloadInvoice } from "../../utils/invoice";
import { showToast } from "../../utils/toast";
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
  Search,
  RotateCcw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Tabs, Badge, StatusChip, Button, EmptyState } from "../components/ui";

const TRACKING_STAGES = [
  { step: 1, title: "Order Placed", desc: "Confirmed & recorded" },
  { step: 2, title: "Processing", desc: "Inspection & packaging" },
  { step: 3, title: "In Transit", desc: "Dispatched with carrier" },
  { step: 4, title: "Out for Delivery", desc: "Courier en route" },
  { step: 5, title: "Delivered", desc: "Safely received" },
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
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
  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => {
        const s = (o.order_status || "").toLowerCase();
        return s.includes("pending") || s.includes("processing");
      }).length,
    [orders]
  );

  const fulfilledOrders = useMemo(
    () =>
      orders.filter((o) => {
        const s = (o.order_status || "").toLowerCase();
        return s.includes("delivered") || s.includes("fulfilled");
      }).length,
    [orders]
  );

  // Active in-flight order for top spotlight
  const activeOrder = useMemo(() => {
    return orders.find((o) => {
      const s = (o.order_status || "").toLowerCase();
      return !s.includes("delivered") && !s.includes("cancelled");
    });
  }, [orders]);

  // Tab definitions with dynamic counts
  const tabs = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: orders.filter((o) => (o.order_status || "").toLowerCase().includes("pending")).length,
      processing: orders.filter((o) => (o.order_status || "").toLowerCase().includes("processing")).length,
      shipped: orders.filter((o) => (o.order_status || "").toLowerCase().includes("shipped")).length,
      delivered: fulfilledOrders,
      cancelled: orders.filter((o) => (o.order_status || "").toLowerCase().includes("cancel")).length,
    };

    return [
      { id: "all", label: "All Orders", count: counts.all },
      { id: "pending", label: "Pending", count: counts.pending },
      { id: "processing", label: "Processing", count: counts.processing },
      { id: "shipped", label: "Shipped", count: counts.shipped },
      { id: "delivered", label: "Delivered", count: counts.delivered },
      { id: "cancelled", label: "Cancelled", count: counts.cancelled },
    ];
  }, [orders, fulfilledOrders]);

  // Filtered orders based on Tab and Search query
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = (o.order_status || "").toLowerCase();
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "delivered"
          ? status.includes("delivered") || status.includes("fulfilled")
          : status.includes(activeTab);

      const matchesSearch =
        searchQuery.trim() === "" ||
        o.oid?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        String(o.total || "").includes(searchQuery.trim());

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

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

  const handleReorder = (order) => {
    showToast.success(`Items from order #${order.oid} noted for re-order!`);
  };

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8 sm:py-10 pb-24 md:pb-10">
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
                <h3 className="text-2xl font-black text-slate-900">{orders.length}</h3>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">In Transit / Active</p>
                <h3 className="text-2xl font-black text-slate-900">{pendingOrders}</h3>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Delivered / Handed Over</p>
                <h3 className="text-2xl font-black text-slate-900">{fulfilledOrders}</h3>
              </div>
            </div>
          </div>

          {/* ACTIVE ORDER SPOTLIGHT: Put the most important thing first! */}
          {activeOrder && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-900/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Active Shipment in Progress
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Order #{activeOrder.oid}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Estimated delivery via Express Carrier • Placed {moment(activeOrder.date).format("MMM DD, YYYY")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrackOrder(activeOrder)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-md min-h-[44px] transition-all cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /> Track Live Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadInvoice(activeOrder)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold min-h-[44px] transition-all cursor-pointer"
                    title="Download Invoice"
                  >
                    <Download className="w-4 h-4" /> Invoice
                  </button>
                </div>
              </div>

              {/* Progress Stepper Bar */}
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {TRACKING_STAGES.map((stage) => {
                    const currentStep = getTrackingStep(activeOrder);
                    const isDone = stage.step < currentStep;
                    const isCurrent = stage.step === currentStep;

                    return (
                      <div key={stage.step} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-indigo-500 text-white ring-4 ring-indigo-400/30"
                              : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.step}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-medium truncate max-w-[70px] sm:max-w-none ${
                            isCurrent ? "text-indigo-200 font-bold" : "text-slate-400"
                          }`}
                        >
                          {stage.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Orders Section Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Order History & Invoices
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track shipment status, download VAT invoices, or initiate re-orders.
                </p>
              </div>

              {/* Search filter input */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order ID or $"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="px-5 pt-3 bg-slate-50/50 border-b border-slate-100">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="pb-3"
              />
            </div>

            {/* DESKTOP TABLE VIEW (Visible on >=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
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
                        <EmptyState
                          icon={ShoppingBag}
                          title="Please Sign In"
                          description="Log in to view your orders, live trackings, and invoices."
                          actionLabel="Sign In Now"
                          actionHref="/login"
                        />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <EmptyState
                          icon={ShoppingBag}
                          title="No orders found"
                          description={
                            searchQuery
                              ? "No orders matched your search query."
                              : "You haven't placed any orders in this category yet."
                          }
                          actionLabel="Explore Axura Catalog"
                          actionHref="/"
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                        <tr key={o.oid} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">#{o.oid}</span>
                            <span className="text-[11px] text-slate-400">
                              {moment(o.date).format("MMM DD, YYYY")}
                            </span>
                          </td>

                          <td className="p-4">
                            <StatusChip status={o.payment_status || "Pending"} />
                          </td>

                          <td className="p-4">
                            <StatusChip status={o.order_status || "Pending"} />
                          </td>

                          <td className="p-4 font-bold text-slate-900">
                            ${Number(o.total || 0).toFixed(2)}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedTrackOrder(o)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
                              >
                                <Truck className="w-3.5 h-3.5" /> Track Live
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadInvoice(o)}
                                title="Download Official Invoice"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
                              >
                                <Download className="w-3.5 h-3.5" /> Invoice
                              </button>

                              <Link
                                to={`/checkout/${o.oid}/`}
                                title="View Checkout Details"
                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center min-h-[36px] min-w-[36px]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE STACKED CARDS VIEW (Visible on <768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-4 space-y-3">
                  <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                  <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description="No orders match your filter."
                    actionLabel="Shop Now"
                    actionHref="/"
                  />
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div key={o.oid} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">#{o.oid}</span>
                        <p className="text-[11px] text-slate-400">
                          {moment(o.date).format("MMM DD, YYYY • h:mm A")}
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-indigo-600">
                        ${Number(o.total || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={o.order_status || "Pending"} />
                      <StatusChip status={o.payment_status || "Pending"} />
                    </div>

                    {/* Touch-Friendly >=44px Action Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTrackOrder(o)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold min-h-[44px]"
                      >
                        <Truck className="w-4 h-4" /> Track Live
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadInvoice(o)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold min-h-[44px]"
                      >
                        <Download className="w-4 h-4" /> Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Order Tracking Modal with Price Breakdown & Address */}
      {selectedTrackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
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
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carrier Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Carrier & Dispatch:</span>
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-400" /> DHL Express Priority Delivery
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 text-[11px] block">Tracking Code:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    AX-{selectedTrackOrder.oid.toUpperCase()}-EXP
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Timeline Stepper */}
            <div className="space-y-3 py-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shipment Progression
              </h4>
              <div className="space-y-3">
                {TRACKING_STAGES.map((stage) => {
                  const currentStep = getTrackingStep(selectedTrackOrder);
                  const isDone = stage.step < currentStep;
                  const isCurrent = stage.step === currentStep;

                  return (
                    <div key={stage.step} className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? "text-indigo-600" : isDone ? "text-slate-800" : "text-slate-400"
                            }`}
                          >
                            {stage.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Breakdown & Delivery Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Destination Address
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedTrackOrder.full_name || userData?.full_name || "Valued Customer"}
                </p>
                <p className="text-slate-600">
                  {selectedTrackOrder.address || "Main Street delivery"}
                </p>
                <p className="text-slate-600">
                  {selectedTrackOrder.city || "Dhaka"},{" "}
                  {selectedTrackOrder.country || "Bangladesh"}
                </p>
                <p className="text-slate-500">{selectedTrackOrder.mobile || selectedTrackOrder.email}</p>
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Price Breakdown
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>${Number(selectedTrackOrder.sub_total || selectedTrackOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span>${Number(selectedTrackOrder.shipping_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax & VAT:</span>
                  <span>${Number(selectedTrackOrder.tax_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200">
                  <span>Total Paid:</span>
                  <span className="text-indigo-600">
                    ${Number(selectedTrackOrder.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleReorder(selectedTrackOrder)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" /> 1-Tap Reorder
              </button>

              <button
                type="button"
                onClick={() => downloadInvoice(selectedTrackOrder)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download Official Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;