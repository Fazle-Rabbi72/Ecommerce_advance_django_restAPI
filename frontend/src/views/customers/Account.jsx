import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";

const Account = () => {
  const [profile, setProfile] = useState({});
  const [ordersCount, setOrdersCount] = useState(0);
  const user_data = UserData();

  useEffect(() => {
    if (!user_data?.user_id) return;
    let isMounted = true;

    apiInstance
      .get(`user/profile/${user_data.user_id}/`)
      .then((res) => {
        if (isMounted) setProfile(res.data || {});
      })
      .catch((err) => console.warn(err));

    apiInstance
      .get(`customer/orders/${user_data.user_id}/`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setOrdersCount(res.data.length);
        }
      })
      .catch((err) => console.warn(err));

    return () => {
      isMounted = false;
    };
  }, [user_data?.user_id]);

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 w-full space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-sm space-y-4 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Customer Overview
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile.full_name || user_data?.full_name || "Valued Shopper"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                From your dashboard you can monitor orders, manage your password & security, and view your personalized preferences.
              </p>
            </div>

            <div className="pt-2 flex gap-4">
              <Link
                to="/customer/orders/"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 text-decoration-none shadow-md shadow-indigo-600/30 transition-all"
              >
                <Package className="w-4 h-4" /> View My Orders
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 text-decoration-none transition-all"
              >
                Browse Store <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {ordersCount}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Account Status</p>
                <h3 className="text-base font-bold text-slate-900">
                  Active
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Protection</p>
                <h3 className="text-base font-bold text-slate-900">
                  256-Bit SSL
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
