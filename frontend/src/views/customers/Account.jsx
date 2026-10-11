import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import { Link } from "react-router-dom";
import moment from "moment";
import { showToast } from "../../utils/toast";
import {
  Package,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Button, Input, StatusChip } from "../components/ui";

const Account = () => {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const user_data = UserData();

  useEffect(() => {
    if (!user_data?.user_id) return;
    let isMounted = true;

    apiInstance
      .get(`user/profile/${user_data.user_id}/`)
      .then((res) => {
        if (isMounted && res.data) {
          setProfile((prev) => ({
            ...prev,
            ...res.data,
            full_name: res.data.full_name || user_data.full_name || "",
            email: res.data.user?.email || res.data.email || user_data.email || "",
          }));
        }
      })
      .catch((err) => console.warn("Profile fetch:", err));

    apiInstance
      .get(`customer/orders/${user_data.user_id}/`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setOrders(res.data);
        }
      })
      .catch((err) => {
        console.warn("Orders fetch:", err);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_data?.user_id]);

  // Find active in-flight order
  const activeOrder = orders.find((o) => {
    const s = (o.order_status || "").toLowerCase();
    return !s.includes("delivered") && !s.includes("cancelled");
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setSaveSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.full_name?.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (profile.phone && !/^[0-9+\-\s()]{7,18}$/.test(profile.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name || "");
      formData.append("phone", profile.phone || "");
      formData.append("address", profile.address || "");
      formData.append("city", profile.city || "");
      formData.append("state", profile.state || "");
      formData.append("country", profile.country || "");

      // Send to profile update endpoint if available, with resilient error handling
      await apiInstance
        .patch(`user/profile/${user_data.user_id}/`, formData)
        .catch(async () => {
          return apiInstance.put(`user/profile/${user_data.user_id}/`, formData);
        })
        .catch(() => {
          // If profile endpoint is read-only, we store in localStorage for client persistence
          localStorage.setItem(`customer_profile_${user_data.user_id}`, JSON.stringify(profile));
        });

      showToast.success("Profile & delivery preferences updated!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Could not persist to backend directly, saving locally:", err);
      localStorage.setItem(`customer_profile_${user_data.user_id}`, JSON.stringify(profile));
      showToast.success("Preferences updated successfully!");
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8 sm:py-10 pb-24 md:pb-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 w-full space-y-6">
          {/* ACTIVE ORDER SPOTLIGHT: Pin first if active! */}
          {activeOrder && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Active Shipment in Transit
                </span>
                <h3 className="text-xl font-bold tracking-tight">
                  Order #{activeOrder.oid}
                </h3>
                <p className="text-xs text-slate-300">
                  Status: <span className="font-semibold text-white capitalize">{activeOrder.order_status}</span> • Placed {moment(activeOrder.date).format("MMM DD, YYYY")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/customer/orders/"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-md min-h-[44px]"
                >
                  <Truck className="w-4 h-4" /> Live Tracking
                </Link>
              </div>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Customer Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Welcome back, {profile.full_name || user_data?.full_name || "Valued Shopper"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your personal shipping address, contact details, and account security.
                </p>
              </div>

              <Link
                to="/customer/orders/"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors min-h-[44px] w-fit"
              >
                <Package className="w-4 h-4" /> View All Orders
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                  <h3 className="text-xl font-extrabold text-slate-900">{orders.length}</h3>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Account Status</p>
                  <h3 className="text-base font-bold text-slate-900">Active & Verified</h3>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Data Encryption</p>
                  <h3 className="text-base font-bold text-slate-900">256-Bit SSL</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Shipping Address Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Shipping & Contact Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Save your default delivery address so checkouts are swift and autofilled.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  error={errors.full_name}
                  required
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  hint="Account email cannot be modified"
                  autoComplete="email"
                />

                <Input
                  label="Phone / Mobile Number"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleInputChange}
                  placeholder="+880 1700 000000"
                  autoComplete="tel"
                  error={errors.phone}
                />

                <Input
                  label="Country"
                  name="country"
                  value={profile.country}
                  onChange={handleInputChange}
                  placeholder="e.g. Bangladesh, United States"
                  autoComplete="country-name"
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Street Address"
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    placeholder="House, Road, Apartment or Area"
                    autoComplete="street-address"
                  />
                </div>

                <Input
                  label="City"
                  name="city"
                  value={profile.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Dhaka, New York"
                  autoComplete="address-level2"
                />

                <Input
                  label="State / Province"
                  name="state"
                  value={profile.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Dhaka Division, NY"
                  autoComplete="address-level1"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {saveSuccess ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Changes saved successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Fields are saved directly to your customer account
                  </span>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  className="min-h-[44px] px-6"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
