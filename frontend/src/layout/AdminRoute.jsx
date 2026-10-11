import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import UserData from "../views/plugin/UserData";
import { showToast } from "../utils/toast";

const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuthStore();
  const userData = UserData();

  const isSuperUser = Boolean(user?.is_superuser || userData?.is_superuser);

  useEffect(() => {
    if (!loading && isLoggedIn && !isSuperUser) {
      showToast.error("Access denied: Administrative privileges required.");
    }
  }, [loading, isLoggedIn, isSuperUser]);

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
