import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Headphones,
  RefreshCw,
  Mail,
  ArrowRight,
} from "lucide-react";

const StoreFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Trust & Guarantee Highlights Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Free Delivery</h4>
                <p className="text-xs text-slate-400">On all orders over $99</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Secure Checkout</h4>
                <p className="text-xs text-slate-400">Stripe 256-bit SSL encrypted</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">30 Days Return</h4>
                <p className="text-xs text-slate-400">Hassle-free guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">24/7 Concierge</h4>
                <p className="text-xs text-slate-400">Dedicated customer care</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                LuxeStore
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Engineered for high-scale e-commerce excellence. Discover curated collections, verified quality, and seamless global fulfillment.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="#facebook"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-sm"></i>
              </a>
              <a
                href="#twitter"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter text-sm"></i>
              </a>
              <a
                href="#instagram"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-sm"></i>
              </a>
              <a
                href="#linkedin"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in text-sm"></i>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Featured Products
                </Link>
              </li>
              <li>
                <Link to="/cart/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/customer/orders/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Account & Help
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/customer/account/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              VIP Newsletter
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Get 15% off your first luxury order and early access to drops.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} LuxeStore Inc. All rights reserved. Built for 1M+ active shoppers.
          </p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
