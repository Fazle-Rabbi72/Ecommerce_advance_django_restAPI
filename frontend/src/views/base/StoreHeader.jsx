import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { CartContext } from "../plugin/Context";
import apiInstance from "../../utils/axios";
import {
  ShoppingCart,
  Search as SearchIcon,
  User,
  Package,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Heart,
  ShieldCheck,
  MapPin,
  Flame,
  ArrowRight,
} from "lucide-react";

const StoreHeader = () => {
  const { isLoggedIn, user, hydrateUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const dropdownRef = useRef(null);

  const cartContextVal = useContext(CartContext);
  const cartCount = Array.isArray(cartContextVal) ? cartContextVal[0] : 0;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  // Fetch Wishlist count for logged-in user
  useEffect(() => {
    if (!user?.user_id) {
      setWishlistCount(0);
      return;
    }
    let isMounted = true;
    apiInstance
      .get(`customer/wishlist/${user.user_id}/`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setWishlistCount(res.data.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.user_id, location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const isAdmin = Boolean(user?.is_superuser);

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all">
      {/* Top Notification / Micro-bar */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-slate-300 text-[11px] py-1.5 px-4 hidden md:block">
        <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Flash Deal: Free Global Express Shipping on orders over $99
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400" />
              Delivering to: <strong className="text-slate-200">Global</strong>
            </span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <Link
              to="/customer/orders/"
              className="hover:text-white transition-colors text-decoration-none"
            >
              Order Tracking
            </Link>
            <Link
              to="/wishlist/"
              className="hover:text-white transition-colors text-decoration-none flex items-center gap-1"
            >
              <Heart className="w-3 h-3 text-rose-400" />
              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
            {isAdmin && (
              <Link
                to="/admin-dashboard/"
                className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 text-decoration-none font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-decoration-none group shrink-0"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <Sparkles className="w-6 h-6" />
              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent block leading-tight">
                  LuxeStore
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block -mt-0.5">
                Global Commerce
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search premium products, electronics, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav links */}
            <nav className="hidden xl:flex items-center gap-6 mr-2 text-xs sm:text-sm font-semibold text-slate-600">
              <Link
                to="/"
                className={`hover:text-indigo-600 transition-colors text-decoration-none ${
                  location.pathname === "/" ? "text-indigo-600 font-bold" : ""
                }`}
              >
                Products
              </Link>
              <Link
                to="/customer/orders/"
                className="hover:text-indigo-600 transition-colors text-decoration-none"
              >
                Live Orders
              </Link>
            </nav>

            {/* Admin Hub Shortcut */}
            {isAdmin && (
              <Link
                to="/admin-dashboard/"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950 text-indigo-200 border border-indigo-800 hover:bg-indigo-900 text-xs font-bold transition-all text-decoration-none shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Hub</span>
              </Link>
            )}

            {/* Wishlist Button */}
            <Link
              to="/wishlist/"
              className="relative p-2.5 rounded-2xl text-slate-700 hover:text-rose-600 hover:bg-rose-50/80 transition-all text-decoration-none group"
              aria-label="Wishlist"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5 transition-transform group-hover:scale-110" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart/"
              className="relative p-2.5 rounded-2xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all text-decoration-none group"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-indigo-600/30 animate-pulse">
                  {cartCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 bg-slate-200 text-slate-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  0
                </span>
              )}
            </Link>

            {/* User Profile / Auth Links */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                    {user?.full_name ? user.full_name.charAt(0) : "U"}
                  </div>
                  <span className="text-xs font-bold text-slate-700 max-w-[90px] truncate hidden sm:inline-block">
                    {user?.full_name || "Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {user?.email || user?.full_name || "Customer"}
                      </p>
                    </div>

                    <div className="py-1 text-xs">
                      {isAdmin && (
                        <Link
                          to="/admin-dashboard/"
                          className="flex items-center gap-2.5 px-4 py-2.5 font-bold text-indigo-600 hover:bg-indigo-50 text-decoration-none transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/customer/account/"
                        className="flex items-center gap-2.5 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-decoration-none transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile & Account
                      </Link>
                      <Link
                        to="/customer/orders/"
                        className="flex items-center gap-2.5 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-decoration-none transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        Live Orders & Tracking
                      </Link>
                      <Link
                        to="/wishlist/"
                        className="flex items-center gap-2.5 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 text-decoration-none transition-colors"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        My Wishlist ({wishlistCount})
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <Link
                        to="/logout"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 text-decoration-none transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 rounded-xl hover:bg-slate-100 text-decoration-none transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/30 text-decoration-none transition-all"
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/80 space-y-4 animate-in fade-in duration-150">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <nav className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              <Link
                to="/"
                className="px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-decoration-none"
              >
                All Products
              </Link>
              <Link
                to="/cart/"
                className="px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-decoration-none flex justify-between items-center"
              >
                <span>Shopping Cart</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cartCount}
                </span>
              </Link>
              <Link
                to="/wishlist/"
                className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-decoration-none flex justify-between items-center"
              >
                <span>My Wishlist</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {wishlistCount}
                </span>
              </Link>
              <Link
                to="/customer/orders/"
                className="px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-decoration-none"
              >
                Live Order Tracking
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-dashboard/"
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-950 text-indigo-300 font-bold text-decoration-none flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Admin Dashboard Portal
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    to="/customer/account/"
                    className="px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 text-decoration-none"
                  >
                    My Account Profile
                  </Link>
                  <Link
                    to="/logout"
                    className="px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 text-decoration-none"
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    className="flex-1 text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-decoration-none"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-decoration-none"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default StoreHeader;
