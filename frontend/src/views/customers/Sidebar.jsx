import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

const Sidebar = () => {
  const [profile, setProfile] = useState({});
  const user_data = UserData();
  const location = useLocation();

  useEffect(() => {
    if (!user_data?.user_id) return;
    let isMounted = true;

    apiInstance
      .get(`user/profile/${user_data.user_id}/`)
      .then((res) => {
        if (isMounted) setProfile(res.data || {});
      })
      .catch((err) => {
        console.warn("Profile fetch skipped:", err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, [user_data?.user_id]);

  const navItems = [
    {
      to: "/customer/account/",
      label: "My Account",
      icon: User,
    },
    {
      to: "/customer/orders/",
      label: "Order History",
      icon: Package,
    },
    {
      to: "/customer/wishlist/",
      label: "Saved Wishlist",
      icon: Heart,
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-3">
        <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-md">
          {profile.image ? (
            <img
              src={profile.image}
              alt="Profile"
              className="w-full h-full rounded-full object-cover bg-white"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <User className="w-10 h-10" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {profile.full_name || user_data?.full_name || "Customer Account"}
          </h2>
          <p className="text-xs text-slate-400 truncate max-w-[200px] mx-auto">
            {profile.email || user_data?.email || "customer@axurashop.com"}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
          <Shield className="w-3 h-3" /> Verified Member
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-decoration-none transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-2 border-t border-slate-100">
          <Link
            to="/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 text-decoration-none transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
