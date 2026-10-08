import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import { CartContext } from "../plugin/Context";
import { showToast } from "../../utils/toast";
import {
  ProductCardSkeleton,
  CategoryItemSkeleton,
} from "../components/Skeleton";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  ShoppingCart,
  Heart,
  SlidersHorizontal,
  ArrowRight,
  Star,
  Check,
  Plus,
  Minus,
  Sparkles,
  Truck,
  CheckCircle2,
  X,
  Filter,
  Flame,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Per-product state maps
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [addingToCart, setAddingToCart] = useState({});

  // Filter & Search states
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPriceBracket, setSelectedPriceBracket] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  const cart_id = CardID();

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => { };

  // Fetch Products
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiInstance
      .get("products/")
      .then((res) => {
        if (isMounted) {
          setProducts(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Categories
  useEffect(() => {
    let isMounted = true;
    setCategoriesLoading(true);
    apiInstance
      .get("category/")
      .then((res) => {
        if (isMounted) {
          setCategories(Array.isArray(res.data) ? res.data : []);
          setCategoriesLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        if (isMounted) setCategoriesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch User Wishlist to sync heart states
  useEffect(() => {
    if (!userData?.user_id) return;
    let isMounted = true;
    apiInstance
      .get(`customer/wishlist/${userData.user_id}/`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((w) => {
            if (w.product?.id) map[w.product.id] = true;
          });
          setWishlist(map);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [userData?.user_id]);

  const handleColorSelect = (productId, colorName) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorName,
    }));
  };

  const handleSizeSelect = (productId, sizeName) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: sizeName,
    }));
  };

  const handleQuantityAdjust = (productId, delta) => {
    const current = selectedQuantities[productId] || 1;
    const nextVal = Math.max(1, current + delta);
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: nextVal,
    }));
  };

  const toggleWishlist = async (productId) => {
    if (!userData?.user_id) {
      // Local fallback for guest
      setWishlist((prev) => {
        const next = !prev[productId];
        if (next) {
          showToast.success("Added to Wishlist");
        } else {
          showToast.info("Removed from Wishlist");
        }
        return { ...prev, [productId]: next };
      });
      return;
    }

    try {
      const res = await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
        product_id: productId,
        user_id: userData.user_id,
      });

      setWishlist((prev) => {
        const next = !prev[productId];
        if (next) {
          showToast.success("Saved to your Amazon Wishlist");
        } else {
          showToast.info("Removed from Wishlist");
        }
        return { ...prev, [productId]: next };
      });
    } catch (err) {
      showToast.error("Could not update Wishlist");
    }
  };

  const handleAddToCart = async (product) => {
    const productId = product.id;
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));

    const color =
      selectedColors[productId] ||
      (product.color?.length > 0 ? product.color[0].name : "No Color");
    const size =
      selectedSizes[productId] ||
      (product.size?.length > 0 ? product.size[0].name : "No Size");
    const quantity = selectedQuantities[productId] || 1;

    try {
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("user_id", userData?.user_id || 0);
      formData.append("quantity", quantity);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount || 0);
      formData.append(
        "country",
        typeof currentAddress === "object"
          ? currentAddress.country || "United States"
          : currentAddress || "United States"
      );
      formData.append("size", size);
      formData.append("color", color);
      formData.append("cart_id", cart_id);

      const response = await apiInstance.post("cart-view/", formData);

      // Refresh cart count
      const url = userData?.user_id
        ? `/cart-list/${cart_id}/${userData.user_id}/`
        : `/cart-list/${cart_id}/`;

      const listRes = await apiInstance.get(url);
      if (Array.isArray(listRes.data)) {
        setCartCount(listRes.data.length);
      }

      showToast.success(response.data?.message || `Added ${quantity} item(s) to Cart!`);
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Could not add item to cart. Please try again."
      );
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const clearAllFilters = () => {
    setActiveCategory("all");
    setSelectedPriceBracket("all");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStockOnly(false);
    setDealsOnly(false);
    setSortBy("default");
    showToast.info("Filters cleared");
  };

  // Filter & Sort Pipeline
  const filteredProducts = products
    .filter((p) => {
      // Category filter
      if (activeCategory !== "all") {
        const catMatch =
          p.category?.id?.toString() === activeCategory.toString() ||
          p.category?.title?.toLowerCase() === activeCategory.toLowerCase();
        if (!catMatch) return false;
      }

      // Price Brackets
      const price = Number(p.price) || 0;
      if (selectedPriceBracket === "under-25" && price >= 25) return false;
      if (selectedPriceBracket === "25-50" && (price < 25 || price > 50)) return false;
      if (selectedPriceBracket === "50-100" && (price < 50 || price > 100)) return false;
      if (selectedPriceBracket === "100-200" && (price < 100 || price > 200)) return false;
      if (selectedPriceBracket === "200-above" && price < 200) return false;

      // Custom Min / Max Price
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      // Rating Filter
      const rating = Number(p.rating) || 4.5;
      if (minRating > 0 && rating < minRating) return false;

      // In Stock Only
      if (inStockOnly && (p.stock_qty || 0) <= 0) return false;

      // Deals Only
      if (dealsOnly && (!p.old_price || Number(p.old_price) <= Number(p.price))) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price) - Number(b.price);
      if (sortBy === "price-high") return Number(b.price) - Number(a.price);
      if (sortBy === "rating") return (Number(b.rating) || 4.8) - (Number(a.rating) || 4.8);
      if (sortBy === "newest") return new Date(b.date || 0) - new Date(a.date || 0);
      return 0;
    });

  return (
    <div className="pb-20 max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white my-8 py-12 sm:py-16 px-6 sm:px-10 lg:px-14 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_55%)]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Amazon Prime Equivalent Fast Delivery Included
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Premium Marketplace &{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
                Exclusive Deals
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              Shop millions of verified products from global brand partners. Guaranteed next-day delivery, seamless 30-day hassle-free returns, and live dispatch tracking.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#products-section"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] text-decoration-none"
              >
                Explore All Products <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-xs text-slate-300">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Prime Express: <strong>FREE Delivery Tomorrow</strong></span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:col-span-4 justify-end">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center space-y-3 w-64 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white">100% Buyer Guarantee</h3>
              <p className="text-[11px] text-slate-400">
                Verified genuine products with automated invoice generation & tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout: Filter Sidebar + Products Grid */}
      <div id="products-section" className="flex flex-col lg:flex-row gap-8 items-start">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block w-72 2xl:w-80 shrink-0 sticky top-28 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Filters & Refinements
              </h3>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Department / Category Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Department / Category
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${activeCategory === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] opacity-75">{products.length}</span>
                </button>
                {categories.map((c) => {
                  const isSelected =
                    activeCategory === c.id?.toString() ||
                    activeCategory === c.title?.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id?.toString() || c.title)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                        }`}
                    >
                      <span className="truncate">{c.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Brackets (Amazon style) */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Price
              </h4>
              <div className="space-y-2 text-xs font-medium text-slate-600">
                {[
                  { id: "all", label: "All Prices" },
                  { id: "under-25", label: "Under $25" },
                  { id: "25-50", label: "$25 to $50" },
                  { id: "50-100", label: "$50 to $100" },
                  { id: "100-200", label: "$100 to $200" },
                  { id: "200-above", label: "$200 & Above" },
                ].map((bracket) => (
                  <label
                    key={bracket.id}
                    className="flex items-center gap-2.5 cursor-pointer hover:text-indigo-600"
                  >
                    <input
                      type="radio"
                      name="price_bracket"
                      checked={selectedPriceBracket === bracket.id}
                      onChange={() => setSelectedPriceBracket(bracket.id)}
                      className="accent-indigo-600"
                    />
                    <span>{bracket.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Min / Max Price */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <input
                  type="number"
                  placeholder="$ Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="$ Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Customer Reviews Rating Filter (Amazon style) */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Customer Reviews
              </h4>
              <div className="space-y-2 text-xs">
                {[4, 3, 2].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-xl transition-all ${minRating === stars
                      ? "bg-amber-50 text-amber-800 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < stars
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                            }`}
                        />
                      ))}
                    </div>
                    <span>& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  In Stock Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Discount Deals Only
                </span>
                <input
                  type="checkbox"
                  checked={dealsOnly}
                  onChange={(e) => setDealsOnly(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCTS AREA */}
        <div className="flex-1 w-full space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>

              <div className="text-xs font-semibold text-slate-600">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of {products.length} products
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="default">Featured / Best Match</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid: Ultra-responsive 1 -> 2 -> 3 -> 4 -> 5 -> 6 columns */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <ProductCardSkeleton key={n} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                No products match your filters
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Try loosening your category, rating, or price criteria to see more items.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6 gap-6">
              {filteredProducts.map((p) => {
                const currentQty = selectedQuantities[p.id] || 1;
                const isWishlisted = Boolean(wishlist[p.id]);
                const isAdding = Boolean(addingToCart[p.id]);

                // Discount calculation
                const discount =
                  p.old_price && Number(p.old_price) > Number(p.price)
                    ? Math.round(
                      ((Number(p.old_price) - Number(p.price)) /
                        Number(p.old_price)) *
                      100
                    )
                    : null;

                const inStock = (p.stock_qty || 0) > 0;
                const isLowStock = p.stock_qty > 0 && p.stock_qty <= 5;

                return (
                  <div
                    key={p.id}
                    className="group relative bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-500/40 p-4 sm:p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_22px_45px_-12px_rgba(79,70,229,0.14)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden"
                  >
                    {/* Top ambient hover accent line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div>
                      {/* Premium Image Container */}
                      <div className="relative w-full aspect-[4/3.8] rounded-2xl overflow-hidden bg-slate-50/90 mb-3.5 border border-slate-100 group/img">
                        <Link to={`/detail/${p?.slug}/`} className="block w-full h-full">
                          <ImageWithFallback
                            src={p?.image}
                            alt={p?.title || "Product"}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                          />
                        </Link>

                        {/* Floating Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                          {p.featured ? (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md shadow-orange-500/20 uppercase tracking-wider backdrop-blur-md">
                              <Sparkles className="w-2.5 h-2.5" /> Featured
                            </span>
                          ) : null}
                          {discount ? (
                            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md shadow-rose-500/20 tracking-tight backdrop-blur-md">
                              {discount}% OFF
                            </span>
                          ) : null}
                        </div>

                        {/* Glassmorphic Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          className={`absolute top-3 right-3 w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 z-10 shadow-sm backdrop-blur-md ${isWishlisted
                            ? "bg-rose-50 text-rose-500 border border-rose-200 scale-105"
                            : "bg-white/85 hover:bg-white text-slate-400 hover:text-rose-500 border border-white/60 hover:scale-110 active:scale-95"
                            }`}
                          aria-label="Save to Wishlist"
                          title="Save to Wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform ${isWishlisted ? "fill-rose-500 scale-110" : ""
                              }`}
                          />
                        </button>

                        {/* Quick View Floating Overlay on Hover */}
                        <Link
                          to={`/detail/${p?.slug}/`}
                          className="absolute bottom-3 inset-x-3 py-2 px-3 bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Category Pill & Express Delivery */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-100/60 uppercase tracking-wider truncate max-w-[120px]">
                          {p.category?.title || "Store Collection"}
                        </span>
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] text-emerald-700 font-bold">Fast Delivery</span>
                        </div>
                      </div>

                      {/* Product Title (Compact and refined) */}
                      <Link
                        to={`/detail/${p?.slug}/`}
                        className="block group/title text-decoration-none"
                      >
                        <h5 className="text-[9.5px] sm:text-[10px] font-semibold text-slate-700 group-hover/title:text-indigo-600 transition-colors line-clamp-2 mb-1 leading-snug tracking-tight">
                          {p?.title}
                        </h5>
                      </Link>

                      {/* Ratings & Review Count */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100/80 px-2 py-0.5 rounded-lg text-amber-700 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{Number(p.rating || 4.8).toFixed(1)}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ({p.reviews_count || "240+"} reviews)
                        </span>
                      </div>

                      {/* Price & Stock Status */}
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            ${Number(p?.price).toFixed(2)}
                          </span>
                          {p?.old_price && Number(p?.old_price) > Number(p?.price) && (
                            <span className="text-xs text-slate-400 line-through font-medium">
                              ${Number(p?.old_price).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Stock Status Badge */}
                        {isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Only {p.stock_qty} Left
                          </span>
                        ) : inStock ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions: Stepper & Luxury Add to Cart Button with ONLY Cart Icon */}
                    <div className="pt-3 border-t border-slate-100/80 mt-auto">
                      <div className="flex items-center gap-2">
                        {/* Stepper */}
                        {inStock && (
                          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shrink-0 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityAdjust(p.id, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded-xl bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs active:scale-90 transition-all"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-900">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityAdjust(p.id, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-xl bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs active:scale-90 transition-all"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Luxury Add to Cart Button (Only Cart Icon) */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          disabled={isAdding || !inStock}
                          title={!inStock ? "Out of Stock" : "Add to Cart"}
                          aria-label="Add to Cart"
                          className={`flex-1 h-10 rounded-2xl font-bold flex items-center justify-center transition-all duration-300 active:scale-95 ${!inStock
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : isAdding
                              ? "bg-indigo-600 text-white cursor-wait shadow-lg shadow-indigo-600/30"
                              : "bg-slate-900 hover:bg-indigo-600 text-white shadow-md hover:shadow-xl hover:shadow-indigo-600/30 group/cartbtn hover:-translate-y-0.5"
                            }`}
                        >
                          {isAdding ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : !inStock ? (
                            <span className="text-[11px] font-bold text-slate-400">Out of Stock</span>
                          ) : (
                            <ShoppingCart className="w-4.5 h-4.5 transition-transform group-hover/cartbtn:scale-115 group-hover/cartbtn:-rotate-6" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-4/5 max-w-sm h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Filters
              </h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Category
              </h4>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("all");
                    setMobileFilterOpen(false);
                  }}
                  className="w-full text-left py-1.5 text-xs font-semibold text-slate-700"
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(c.id?.toString() || c.title);
                      setMobileFilterOpen(false);
                    }}
                    className="w-full text-left py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Price
              </h4>
              <div className="space-y-2 text-xs">
                {["all", "under-25", "25-50", "50-100", "100-200", "200-above"].map(
                  (b) => (
                    <label key={b} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="mobile_price"
                        checked={selectedPriceBracket === b}
                        onChange={() => {
                          setSelectedPriceBracket(b);
                          setMobileFilterOpen(false);
                        }}
                      />
                      <span className="capitalize">{b.replace("-", " ")}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
