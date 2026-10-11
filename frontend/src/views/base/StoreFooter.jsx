import React from "react";
import { Link } from "react-router-dom";
import AxuraLogo from "../components/AxuraLogo";
import {
  ShieldCheck,
  Truck,
  Headphones,
  RefreshCw,
  Mail,
  ArrowRight,
  Store,
} from "lucide-react";

const StoreFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 border-t border-slate-800/80 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Trust & Guarantee Highlights Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Express Global Shipping</h4>
                <p className="text-xs text-slate-400">Free delivery on orders over $99</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Encrypted Checkout</h4>
                <p className="text-xs text-slate-400">Stripe & PayPal 256-bit SSL secured</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-inner">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">30-Day Money Back</h4>
                <p className="text-xs text-slate-400">Hassle-free instant return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">24/7 AI Concierge</h4>
                <p className="text-xs text-slate-400">Smart personalized live assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <AxuraLogo theme="light" size="lg" />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              AxuraShop delivers a multi-vendor commerce ecosystem engineered for next-generation shopping. Discover authentic verified products, ultra-fast delivery, and guaranteed buyer protection.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-sm"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-sky-500 hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter text-sm"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-pink-500 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-sm"></i>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in text-sm"></i>
              </a>
            </div>
          </div>

          {/* Customer Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Shop Catalog
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm list-none p-0 m-0">
              <li>
                <Link to="/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/cart/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/customer/orders/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Live Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Account & Help
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm list-none p-0 m-0">
              <li>
                <Link to="/customer/account/" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  My Profile Settings
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-400 hover:text-indigo-400 text-decoration-none transition-colors">
                  Create Member Account
                </Link>
              </li>
              <li>
                <Link to="/vendor/register/" className="text-emerald-400 hover:text-emerald-300 text-decoration-none transition-colors font-medium flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" /> Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> VIP Newsletter
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Get exclusive promo codes, flash drop alerts, and VIP early access.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing to AxuraShop VIP alerts!"); }} className="space-y-2.5">
              <div className="relative">
                <input
                  type="email"
                  id="footer-newsletter-email"
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                id="footer-newsletter-submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Subscribe for VIP Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="mb-0 text-center sm:text-left">
            &copy; {new Date().getFullYear()} <strong className="text-slate-300">AxuraShop Inc.</strong> All rights reserved. Built for 1M+ active shoppers worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-5 font-medium">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
