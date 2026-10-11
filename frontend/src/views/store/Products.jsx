import React, { useEffect, useState, useContext, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiInstance from "../../utils/axios";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import { CartContext } from "../plugin/Context";
import { showToast } from "../../utils/toast";
import {
  ProductCardSkeleton,
  CategoryItemSkeleton,
  CategoryCardSkeleton,
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
  Grid,
  ChevronLeft,
  ChevronRight,
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryScrollRef = useRef(null);

  // Reset to page 1 whenever any filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    selectedPriceBracket,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    dealsOnly,
    sortBy,
    itemsPerPage,
  ]);

  // Sync active category from URL search params
  useEffect(() => {
    const catQuery = searchParams.get("category");
    if (catQuery) {
      setActiveCategory(catQuery);
    }
  }, [searchParams]);

  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  const cart_id = CardID();

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => { };

  // Fetch Products (Instant 0ms render from sessionStorage + 11ms background revalidation)
  useEffect(() => {
    let isMounted = true;
    try {
      const cached = sessionStorage.getItem("cached_amazon_products_v3");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false);
        }
      }
    } catch (_e) {
      // Storage unavailable or invalid
    }

    apiInstance
      .get("products/")
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setProducts(list);
          setLoading(false);
          try {
            sessionStorage.setItem("cached_amazon_products_v3", JSON.stringify(list));
          } catch (_e) {
            /* ignore storage quota */
          }
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

  // Fetch Categories (Instant 0ms render from sessionStorage)
  useEffect(() => {
    let isMounted = true;
    try {
      const cached = sessionStorage.getItem("cached_amazon_categories_v3");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setCategoriesLoading(false);
        }
      }
    } catch (_e) {
      /* ignore storage quota */
    }

    apiInstance
      .get("category/")
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setCategories(list);
          setCategoriesLoading(false);
          try {
            sessionStorage.setItem("cached_amazon_categories_v3", JSON.stringify(list));
          } catch (_e) {
            /* ignore storage quota */
          }
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

  const _handleColorSelect = (productId, colorName) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorName,
    }));
  };

  const _handleSizeSelect = (productId, sizeName) => {
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
      await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
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
    } catch (_err) {
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

  const handleCategorySelect = (categoryId, categoryTitle) => {
    if (activeCategory === categoryId && categoryId !== "all") {
      // Toggle back to "all" if clicking the active one
      setActiveCategory("all");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("category");
        return next;
      });
      showToast.info("Showing all categories");
    } else {
      setActiveCategory(categoryId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (categoryId === "all") {
          next.delete("category");
        } else {
          next.set("category", categoryId);
        }
        return next;
      });
      if (categoryId === "all") {
        showToast.info("Showing all categories");
      } else if (categoryTitle) {
        showToast.info(`Showing "${categoryTitle}" products`);
      }
    }

    // Smooth scroll down to products section with sticky header offset
    setTimeout(() => {
      const target = document.getElementById("products-section");
      if (target) {
        const headerOffset = 90;
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
      }
    }, 60);
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Find active category title for display in badges and filters
  const activeCategoryObj = categories.find(
    (c) =>
      c.id?.toString() === activeCategory.toString() ||
      c.slug === activeCategory ||
      c.title?.toLowerCase() === activeCategory.toLowerCase()
  );
  const activeCategoryTitle =
    activeCategoryObj?.title || (activeCategory !== "all" ? activeCategory : null);

  const clearAllFilters = () => {
    setActiveCategory("all");
    setSelectedPriceBracket("all");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setInStockOnly(false);
    setDealsOnly(false);
    setSortBy("default");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("category");
      return next;
    });
    showToast.info("Filters cleared");
  };

  // Filter & Sort Pipeline
  const filteredProducts = products
    .filter((p) => {
      // Category filter
      if (activeCategory !== "all") {
        const catMatch =
          p.category?.id?.toString() === activeCategory.toString() ||
          p.category?.slug === activeCategory ||
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

  // Pagination Calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== validCurrentPage) {
      setCurrentPage(newPage);
      setTimeout(() => {
        const el = document.getElementById("products-section");
        if (el) {
          const headerOffset = 90;
          const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }
      }, 60);
    }
  };

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (validCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (validCurrentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="pb-20 max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16">
      {/* Hero Showcase Banner (Amazon Compact Refined Style) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white my-5 py-6 sm:py-8 px-5 sm:px-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_55%)]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>AxuraShop Official • Prime Express Delivery</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-sky-200 to-indigo-100 bg-clip-text text-transparent">
                AxuraShop
              </span>{" "}
              Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Shop millions of verified products from global brand partners on AxuraShop. Guaranteed next-day delivery, seamless 30-day hassle-free returns, and live tracking.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#products-section"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById("products-section");
                  if (target) {
                    const headerOffset = 90;
                    const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-[1.02] text-decoration-none cursor-pointer"
              >
                <span>Explore All Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs text-slate-300">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prime Express: <strong>FREE Delivery Tomorrow</strong></span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:col-span-4 justify-end">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center space-y-2 w-56 shadow-lg">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-white">100% Buyer Guarantee</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Verified genuine products with automated invoice generation & tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Circular Carousel / Slider (Matching User Reference Image) */}
      <section className="mb-8 sm:mb-12 bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs relative">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Featured Categories</span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Browse top categories and verified collections
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeCategory !== "all" && (
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all border border-emerald-200"
              >
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                <span>Show All</span>
              </button>
            )}

            {/* Scroll navigation arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                aria-label="Scroll left"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95"
                aria-label="Scroll right"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container with Floating Edge Arrows */}
        <div className="relative group/slider">
          {/* Floating Left Arrow (Visible on tablet/desktop, mobile uses native touch swipe) */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="hidden sm:flex absolute -left-3 sm:-left-3.5 top-12 sm:top-14 md:top-16 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md hover:shadow-lg text-slate-700 hover:text-emerald-600 hover:border-emerald-300 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Previous categories"
            title="Scroll left"
            style={{ borderRadius: "9999px" }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Floating Right Arrow (Visible on tablet/desktop, mobile uses native touch swipe) */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="hidden sm:flex absolute -right-3 sm:-right-3.5 top-12 sm:top-14 md:top-16 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md hover:shadow-lg text-slate-700 hover:text-emerald-600 hover:border-emerald-300 items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Next categories"
            title="Scroll right"
            style={{ borderRadius: "9999px" }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Slider Track */}
          {categoriesLoading ? (
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-none snap-x">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <CategoryCardSkeleton key={n} />
              ))}
            </div>
          ) : (
            <div
              ref={categoryScrollRef}
              className="flex items-start gap-3 sm:gap-4 md:gap-6 lg:gap-7 overflow-x-auto scroll-smooth py-2 px-1 scrollbar-none snap-x select-none"
            >
              {/* "All Categories" Circular Item */}
              <button
                type="button"
                onClick={() => handleCategorySelect("all")}
                className="w-28 sm:w-32 md:w-36 flex flex-col items-center text-center group cursor-pointer shrink-0 snap-start transition-all outline-none"
              >
                {/* Circular pastel bubble */}
                <div
                  className={`relative aspect-square w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center p-3 sm:p-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${
                    activeCategory === "all"
                      ? "bg-[#d8eedb] ring-3 ring-emerald-500 shadow-md scale-105"
                      : "bg-[#edf7ed] hover:bg-[#e4f3e5]"
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                    <Grid className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  {activeCategory === "all" && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h6
                  className={`mt-3 sm:mt-3.5 text-xs sm:text-[13px] md:text-sm font-bold tracking-tight transition-colors w-full px-1 truncate ${
                    activeCategory === "all"
                      ? "text-emerald-700 font-extrabold"
                      : "text-slate-800 group-hover:text-emerald-700"
                  }`}
                  title="All Categories"
                >
                  All Categories
                </h6>

                {/* Subtitle / Count */}
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                  {products.length}+ Products
                </span>
              </button>

              {/* Individual Category Circular Items */}
              {categories.map((c) => {
                const isSelected =
                  activeCategory === c.id?.toString() ||
                  activeCategory === c.slug ||
                  activeCategory === c.title?.toLowerCase();

                const count = products.filter(
                  (p) =>
                    p.category?.id?.toString() === c.id?.toString() ||
                    p.category?.slug === c.slug ||
                    p.category?.title?.toLowerCase() === c.title?.toLowerCase()
                ).length;

                const categoryImg = c.image;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategorySelect(c.id?.toString(), c.title)}
                    className="w-28 sm:w-32 md:w-36 flex flex-col items-center text-center group cursor-pointer shrink-0 snap-start transition-all outline-none"
                  >
                    {/* Circular pastel bubble */}
                    <div
                      className={`relative aspect-square w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden flex items-center justify-center p-3 sm:p-4 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${
                        isSelected
                          ? "bg-[#d8eedb] ring-3 ring-emerald-500 shadow-md scale-105"
                          : "bg-[#edf7ed] hover:bg-[#e4f3e5]"
                      }`}
                    >
                      <ImageWithFallback
                        src={categoryImg}
                        alt={c.title}
                        className="w-full h-full object-contain rounded-full drop-shadow-xs transition-transform duration-300 group-hover:scale-110"
                        imgClassName="rounded-full"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h6
                      className={`mt-3 sm:mt-3.5 text-xs sm:text-[13px] md:text-sm font-bold tracking-tight transition-colors w-full px-1 truncate ${
                        isSelected
                          ? "text-emerald-700 font-extrabold"
                          : "text-slate-800 group-hover:text-emerald-700"
                      }`}
                      title={c.title}
                    >
                      {c.title}
                    </h6>

                    {/* Subtitle / Count */}
                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                      {count > 0 ? `${count}+ Products` : "0 Products"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
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
                  onClick={() => handleCategorySelect("all")}
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
                    activeCategory === c.slug ||
                    activeCategory === c.title?.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCategorySelect(c.id?.toString(), c.title)}
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
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>

              <div className="text-xs font-semibold text-slate-600">
                Showing <strong className="text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong className="text-slate-900">{totalItems}</strong> products
              </div>

              {/* Active Category Filter Tag */}
              {activeCategory !== "all" && activeCategoryTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs animate-in fade-in duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span>Category: {activeCategoryTitle}</span>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("all")}
                    className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center text-indigo-600 transition-colors ml-0.5"
                    title="Clear category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
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

          {/* Product Cards Grid: Ultra-responsive 2 cols on mobile -> 3 -> 4 -> 5 -> 6 columns */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6 gap-3 sm:gap-6">
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
                {activeCategory !== "all"
                  ? `No products currently available in "${activeCategoryTitle}". Try choosing another category or resetting filters.`
                  : "Try loosening your category, rating, or price criteria to see more items."}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6 gap-3 sm:gap-6">
              {paginatedProducts.map((p) => {
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
                    className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-indigo-500/40 p-3 sm:p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_22px_45px_-12px_rgba(79,70,229,0.14)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden"
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
                        <h5 className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 group-hover/title:text-indigo-600 transition-colors line-clamp-2 mb-1.5 leading-snug tracking-tight">
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
                      <div className="flex flex-wrap items-baseline justify-between gap-1 mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
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

                    {/* Card Actions: Stepper & Luxury Add to Cart Button */}
                    <div className="pt-3 border-t border-slate-100/80 mt-auto">
                      <div className="flex items-center gap-1.5 w-full">
                        {/* Stepper */}
                        {inStock && (
                          <div
                            className="flex items-center bg-slate-100/90 border border-slate-200/80 rounded-full p-0.5 shrink-0 shadow-xs"
                            style={{ borderRadius: "9999px" }}
                          >
                            <button
                              type="button"
                              onClick={() => handleQuantityAdjust(p.id, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-slate-900 shadow-xs active:scale-90 transition-all cursor-pointer"
                              aria-label="Decrease quantity"
                              style={{ borderRadius: "9999px" }}
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-slate-900 select-none">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityAdjust(p.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-slate-900 shadow-xs active:scale-90 transition-all cursor-pointer"
                              aria-label="Increase quantity"
                              style={{ borderRadius: "9999px" }}
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {/* Luxury Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          disabled={isAdding || !inStock}
                          title={!inStock ? "Out of Stock" : "Add to Cart"}
                          aria-label="Add to Cart"
                          style={{ borderRadius: "9999px" }}
                          className={`flex-1 h-9 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 cursor-pointer ${!inStock
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : isAdding
                              ? "bg-indigo-600 text-white cursor-wait shadow-lg shadow-indigo-600/30"
                              : "bg-slate-900 hover:bg-indigo-600 text-white shadow-md hover:shadow-xl hover:shadow-indigo-600/30 group/cartbtn hover:-translate-y-0.5"
                            }`}
                        >
                          {isAdding ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : !inStock ? (
                            <span className="text-[10px] font-bold text-slate-400">Sold Out</span>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5 transition-transform group-hover/cartbtn:scale-110" />
                              <span className="text-[11px] font-bold hidden sm:inline">Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODERN PAGINATION COMPONENT - FULLY ROUNDED */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 order-2 sm:order-1">
                Showing <span className="font-bold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of{" "}
                <span className="font-bold text-slate-900">{totalItems}</span> products
              </div>

              <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  disabled={validCurrentPage === 1}
                  style={{ borderRadius: "9999px" }}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${validCurrentPage === 1
                    ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:border-slate-400"
                    }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Number Pills */}
                {getPaginationPages().map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`dots-${idx}`}
                        className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                      >
                        …
                      </span>
                    );
                  }
                  const isCurrent = page === validCurrentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      style={{ borderRadius: "9999px" }}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${isCurrent
                        ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  disabled={validCurrentPage === totalPages}
                  style={{ borderRadius: "9999px" }}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${validCurrentPage === totalPages
                    ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:border-slate-400"
                    }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2 order-3 text-xs font-medium text-slate-600">
                <span className="hidden md:inline">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  style={{ borderRadius: "9999px" }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={12}>12 items</option>
                  <option value={16}>16 items</option>
                  <option value={24}>24 items</option>
                  <option value={48}>48 items</option>
                </select>
              </div>
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
                    handleCategorySelect("all");
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold transition-all ${activeCategory === "all"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  All Categories
                </button>
                {categories.map((c) => {
                  const isSelected =
                    activeCategory === c.id?.toString() ||
                    activeCategory === c.slug ||
                    activeCategory === c.title?.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleCategorySelect(c.id?.toString(), c.title);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold transition-all ${isSelected
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      {c.title}
                    </button>
                  );
                })}
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
