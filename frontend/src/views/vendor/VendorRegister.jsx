import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../utils/auth";
import { useAuthStore } from "../../store/auth";
import apiInstance from "../../utils/axios";
import { showToast } from "../../utils/toast";
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  DollarSign,
  Package,
  Sparkles,
} from "lucide-react";

const VendorRegister = () => {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopName.trim()) {
      showToast.error("Please provide your Shop or Brand Name.");
      return;
    }

    if (!isLoggedIn) {
      if (password !== password2) {
        showToast.error("Passwords do not match. Please verify.");
        return;
      }
      if (password.length < 6) {
        showToast.error("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      if (!isLoggedIn) {
        // Step 1: Create user account & login automatically
        const regRes = await register(fullName, email, phone, password, password2);
        if (regRes?.error) {
          setLoading(false);
          return;
        }
      }

      // Step 2: Submit Vendor Application
      try {
        const vReq = await apiInstance.post("vendor/request/", {
          shop_name: shopName,
          mobile: phone,
          message: description,
        });
        showToast.success(
          vReq.data?.message || "Seller account created and application submitted!"
        );
      } catch (reqErr) {
        console.warn("Auto vendor request error:", reqErr);
        showToast.info("Account created. Please complete your seller application in dashboard.");
      }

      navigate("/vendor/dashboard/");
    } catch (_err) {
      showToast.error("Failed to complete seller registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-2xl shadow-slate-900/5 space-y-7">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mx-auto">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Open Your Online Storefront</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Apply to Become a Verified Seller
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Join our multi-vendor marketplace. Keep 99.9% of sales with our transparent{" "}
            <strong className="text-emerald-600 font-bold">0.1% platform commission</strong>.
          </p>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center text-[11px] font-bold text-emerald-900">
          <div className="flex flex-col items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>0.1% Admin Fee</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Fast Payouts</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Full Inventory Control</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shop Information Section */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" /> Store & Business Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop / Brand Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Tech & Gadgets"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                About Your Store & Products (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="What kinds of products do you sell? (e.g. smart watches, audio gear, apparel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* User Account Section (if not logged in) */}
          {!isLoggedIn ? (
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Seller Account Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Account Owner Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1700-000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Confirm Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-900">
                You are currently logged in. Submitting will link this shop application to your active account!
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering & Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Seller Application & Open Store</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-center text-xs">
          <p className="text-slate-500">
            Already registered as a seller?{" "}
            <Link
              to="/vendor/login/"
              className="font-bold text-emerald-600 hover:text-emerald-700 text-decoration-none"
            >
              Sign In to Seller Central →
            </Link>
          </p>

          <p className="text-slate-400">
            Looking for standard customer registration?{" "}
            <Link
              to="/register"
              className="font-semibold text-slate-600 hover:text-indigo-600 text-decoration-none"
            >
              Customer Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
