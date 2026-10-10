import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../utils/auth";
import { useAuthStore } from "../../store/auth";
import apiInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";
import {
  Store,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const VendorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    // If already logged in, check if they are vendor and redirect
    if (isLoggedIn) {
      apiInstance
        .get("vendor/me/")
        .then((res) => {
          navigate("/vendor/dashboard/");
        })
        .catch(() => {
          navigate("/vendor/dashboard/");
        });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res?.error) {
        // Check vendor status to give personalized welcome
        try {
          const vRes = await apiInstance.get("vendor/me/");
          if (vRes.data?.is_vendor) {
            showToast.success(`Welcome back, ${vRes.data.vendor_name || "Seller"}!`);
          } else if (vRes.data?.has_pending_request) {
            showToast.info("Your vendor application is currently under review.");
          } else {
            showToast.success("Logged in! Complete your store onboarding.");
          }
        } catch {
          // ignore
        }
        navigate("/vendor/dashboard/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-2xl shadow-slate-900/5 space-y-7">
        {/* Top Seller Badge & Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mx-auto">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Merchant & Seller Central</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to Seller Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Manage your store catalog, dispatch customer orders, and withdraw earnings with our 0.1% platform fee.
          </p>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-[11px] font-semibold text-slate-600">
          <div className="flex flex-col items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>0.1% Platform Fee</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-slate-200">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>99.9% Net Revenue</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Direct Payouts</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Registered Email Address
            </label>
            <input
              type="email"
              placeholder="seller@yourstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Account Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 text-decoration-none"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In to Seller Hub...</span>
              </>
            ) : (
              <>
                <span>Sign In to Seller Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs">
          <p className="text-slate-500">
            Want to open a new storefront?{" "}
            <Link
              to="/vendor/register/"
              className="font-bold text-emerald-600 hover:text-emerald-700 text-decoration-none"
            >
              Apply to Become a Verified Seller →
            </Link>
          </p>

          <p className="text-slate-400">
            Looking for regular customer login?{" "}
            <Link
              to="/login"
              className="font-semibold text-slate-600 hover:text-indigo-600 text-decoration-none"
            >
              Customer Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
