import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import UserData from "../views/plugin/UserData";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuthStore();
  const userData = UserData();

  const isSuperUser = Boolean(user?.is_superuser || userData?.is_superuser);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying administrative credentials...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
              403 Restricted Zone
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Superuser Access Required
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This Administration Control Center is strictly reserved for verified Superusers. Your current account (<strong className="text-slate-200">{user?.email || "User"}</strong>) does not possess superuser authority.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-decoration-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
            </Link>
            <Link
              to="/login"
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-decoration-none shadow-md shadow-indigo-600/30"
            >
              <LogIn className="w-3.5 h-3.5" /> Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
