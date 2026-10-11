import React, { useEffect } from "react";
import { logout } from "../../utils/auth";
import { Link } from "react-router-dom";
import { LogOut, ArrowRight, ShoppingBag } from "lucide-react";

const Logout = () => {
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-900/5 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <LogOut className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            You Have Been Signed Out
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Your session has been securely closed. Thank you for visiting AxuraShop.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/login"
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold text-decoration-none shadow-md shadow-indigo-600/20 transition-all"
          >
            Sign In Again
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold text-decoration-none transition-all flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Logout;
