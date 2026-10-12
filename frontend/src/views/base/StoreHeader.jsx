import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { CartContext } from "../plugin/Context";
import apiInstance from "../../utils/axios";
import AxuraLogo from "../components/AxuraLogo";
import GetCurrentAddress from "../plugin/UserCountry";
import ImageWithFallback from "../components/ImageWithFallback";
import { showToast } from "../../utils/toast";
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
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  Store,
  MapPin,
  Flame,
  Calendar,
  Clock,
  Bell,
  ArrowRight,
  Tag,
  Info,
} from "lucide-react";

const StoreHeader = () => {
  const { isLoggedIn, user, hydrateUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const dropdownRef = useRef(null);

  // Dynamic user location country
  const userAddress = GetCurrentAddress();
  const deliveryCountry = userAddress?.country || "United States";

  // Smart Hide / Block Navbar on scroll down
  const [isNavBlocked, setIsNavBlocked] = useState(false);
  const lastScrollY = useRef(0);

  // Upcoming Products Banner State
  const [upcomingProducts, setUpcomingProducts] = useState([]);
  const [upcomingIdx, setUpcomingIdx] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState(null);

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
  }, [user?.user_id]);

  // Fetch active Upcoming Products
  useEffect(() => {
    let isMounted = true;
    apiInstance
      .get("upcoming-products/")
      .then((res) => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setUpcomingProducts(res.data);
        }
      })
      .catch((err) => {
        console.warn("Upcoming products banner skipped:", err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cycle upcoming banner if multiple
  useEffect(() => {
    if (upcomingProducts.length <= 1) return;
    const interval = setInterval(() => {
      setUpcomingIdx((prev) => (prev + 1) % upcomingProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [upcomingProducts.length]);

  // Smart scroll listener: block/hide navbar on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 80 && currentY > lastScrollY.current + 5) {
        setIsNavBlocked(true);
      } else if (currentY < lastScrollY.current - 5 || currentY <= 30) {
        setIsNavBlocked(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  const isVendor = Boolean(user?.vendor_id && Number(user.vendor_id) > 0);
  const activeUpcoming = upcomingProducts[upcomingIdx];

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-transform duration-300 ease-in-out ${
          isNavBlocked ? "-translate-y-full shadow-none" : "translate-y-0"
        }`}
      >
        {/* Top Micro-bar: Deals, Dynamic Country & Direct Links */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-slate-300 text-[11px] py-1.5 px-4 hidden md:block">
          <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-indigo-300 font-semibold tracking-wide">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                Axura Flash Deal: Free Express Shipping on orders over $99
              </span>
              <span className="text-slate-600">|</span>
              {/* Dynamic Delivery Country based on Location */}
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Delivering to:</span>
                <strong className="text-slate-100 font-bold tracking-wide">
                  {deliveryCountry}
                </strong>
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

        {/* UPCOMING PRODUCT BANNER HEADER SECTION */}
        {!bannerDismissed && activeUpcoming && (
          <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-b border-indigo-900/60 text-white text-xs py-2 px-3 sm:px-4 shadow-inner">
            <div className="max-w-screen-4k mx-auto px-2 sm:px-6 lg:px-12 2xl:px-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden flex-1">
                {/* Status Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm shrink-0">
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  {activeUpcoming.badge_text || "Upcoming Release"}
                </span>

                {/* Product Thumbnail */}
                {activeUpcoming.image && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/20">
                    <ImageWithFallback
                      src={activeUpcoming.image}
                      alt={activeUpcoming.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Title & Info */}
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white truncate text-xs sm:text-sm">
                    {activeUpcoming.title}
                  </span>
                  {activeUpcoming.sub_title && (
                    <span className="text-indigo-200 text-xs truncate hidden lg:inline">
                      — {activeUpcoming.sub_title}
                    </span>
                  )}
                  {activeUpcoming.vendor_name && (
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline shrink-0">
                      (by {activeUpcoming.vendor_name})
                    </span>
                  )}
                </div>

                {/* Release details pills */}
                <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-amber-300 shrink-0">
                  {activeUpcoming.release_date && (
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Launch: {activeUpcoming.release_date}
                    </span>
                  )}
                  {activeUpcoming.expected_price && (
                    <span className="bg-white/10 px-2 py-0.5 rounded-md text-emerald-300">
                      Est. ${activeUpcoming.expected_price}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions & Carousel Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(activeUpcoming)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Preview
                </button>

                {upcomingProducts.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setUpcomingIdx(
                          (prev) =>
                            (prev - 1 + upcomingProducts.length) %
                            upcomingProducts.length
                        )
                      }
                      aria-label="Previous upcoming product"
                      className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUpcomingIdx(
                          (prev) => (prev + 1) % upcomingProducts.length
                        )
                      }
                      aria-label="Next upcoming product"
                      className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss upcoming product banner"
                  className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                  title="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Navbar */}
        <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            {/* Brand Logo - AxuraShop */}
            <AxuraLogo size="md" />

            {/* Search Bar (Desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-2 lg:mx-6 relative group"
            >
              <div className="relative w-full flex items-center">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="desktop-search-input"
                  placeholder="Search premium products, electronics, brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-28 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-2xl border border-slate-200/90 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs outline-none transition-all duration-200"
                />
                {search && (
                  <button
                    type="button"
                    id="desktop-search-clear"
                    onClick={() => setSearch("")}
                    className="absolute right-24 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  id="desktop-search-submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Action Icons & Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Nav links */}
              <nav className="hidden xl:flex items-center gap-5 mr-1 text-xs sm:text-sm font-semibold text-slate-600">
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

              {/* Seller Portal Shortcut (Vendors Only) */}
              {isVendor && (
                <Link
                  to="/vendor/dashboard/"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all border border-emerald-200/80 text-decoration-none"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seller Portal</span>
                </Link>
              )}

              {/* Cart Button */}
              <Link
                to="/cart/"
                id="header-cart-btn"
                className="relative p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all group text-decoration-none border border-slate-200/60"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-indigo-600 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-bold">Cart</span>
              </Link>

              {/* User Account / Profile Dropdown */}
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    id="header-profile-menu-button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-700 cursor-pointer"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="hidden lg:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                      {user?.full_name || "Account"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100">
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
                            className="flex items-center gap-2.5 px-4 py-2.5 font-bold text-amber-700 bg-amber-50/60 hover:bg-amber-100 text-decoration-none transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Admin Dashboard
                          </Link>
                        )}
                        {isVendor && (
                          <Link
                            to="/vendor/dashboard/"
                            className="flex items-center gap-2.5 px-4 py-2.5 font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 text-decoration-none transition-colors"
                          >
                            <Store className="w-4 h-4 text-emerald-600" />
                            Vendor Dashboard
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
                className="md:hidden p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 cursor-pointer"
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
              {/* Dynamic Location in Mobile Menu */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivering to:</span>
                </span>
                <strong className="text-slate-900 font-bold">{deliveryCountry}</strong>
              </div>

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

      {/* UPCOMING PRODUCT DETAILS MODAL */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors z-10 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image */}
            <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
              <ImageWithFallback
                src={activeModalProduct.image}
                alt={activeModalProduct.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  {activeModalProduct.badge_text || "Upcoming Release"}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
                  <span>{activeModalProduct.category_title || "Exclusive Release"}</span>
                  {activeModalProduct.vendor_name && (
                    <>
                      <span>·</span>
                      <span>By {activeModalProduct.vendor_name}</span>
                    </>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {activeModalProduct.title}
                </h3>
                {activeModalProduct.sub_title && (
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {activeModalProduct.sub_title}
                  </p>
                )}
              </div>

              {activeModalProduct.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {activeModalProduct.description}
                </p>
              )}

              {/* Release Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Expected Launch
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {activeModalProduct.release_date || "Coming Soon"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Expected Price
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {activeModalProduct.expected_price
                      ? `$${activeModalProduct.expected_price}`
                      : "Price TBA"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    showToast.success("You will be notified as soon as this item launches!");
                    setActiveModalProduct(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notify Me on Launch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(null)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreHeader;
