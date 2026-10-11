import React from "react";
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";
import { Sparkles, User, Package, LogOut, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const { isLoggedIn, user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isLoggedIn ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-2xl shadow-md">
              {user?.full_name ? user.full_name.charAt(0) : "U"}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Active Member
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {user?.full_name || "Account Dashboard"}
              </h1>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/customer/orders/"
              className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 text-decoration-none transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    My Orders
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track shipments & review invoices
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              to="/customer/account/"
              className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 text-decoration-none transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Profile Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update account details & security
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Link
              to="/logout"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-decoration-none transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Welcome to AxuraShop
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sign in to access your saved orders, personalized recommendations, and wishlists.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl text-decoration-none transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl text-decoration-none transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
