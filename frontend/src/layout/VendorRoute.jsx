import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import UserData from "../views/plugin/UserData";
import { showToast } from "../utils/toast";

const VendorRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuthStore();
  const userData = UserData();
  const location = useLocation();

  const isVendor = Boolean(
    (user?.vendor_id && Number(user.vendor_id) > 0) ||
    (userData?.vendor_id && Number(userData.vendor_id) > 0) ||
    user?.is_superuser ||
    userData?.is_superuser
  );

  useEffect(() => {
    if (!loading && isLoggedIn && !isVendor) {
      showToast.warning("Vendor access required. Please apply or sign in with your seller account.");
    }
  }, [loading, isLoggedIn, isVendor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying seller authorization...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/vendor/login/" state={{ from: location }} replace />;
  }

  if (!isVendor) {
    return <Navigate to="/vendor/register/" replace />;
  }

  return <>{children}</>;
};

export default VendorRoute;
