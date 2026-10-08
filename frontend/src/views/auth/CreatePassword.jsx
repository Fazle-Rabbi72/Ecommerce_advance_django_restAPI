import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import { Sparkles, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const otp = searchParams.get("otp");
  const uidb64 = searchParams.get("uidb64");
  const reset_token = searchParams.get("reset_token");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || !uidb64) {
      Swal.fire({
        icon: "error",
        title: "Invalid Reset Link",
        text: "This password reset link is invalid or has expired.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Passwords Do Not Match",
        text: "Please verify that both passwords are typed identically.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      password: password,
      otp: otp,
      uidb64: uidb64,
      reset_token: reset_token,
    };

    try {
      await apiInstance.post("user/password-change/", payload);
      await Swal.fire({
        icon: "success",
        title: "Password Changed Successfully",
        text: "You can now sign in with your new password.",
        confirmButtonColor: "#4f46e5",
      });
      navigate("/login");
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Password Change Failed",
        text:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "Could not update password. Please request a new reset link.",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-900/5 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500">
            Set a new secure password for your LuxeStore account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 text-decoration-none transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatePassword;
