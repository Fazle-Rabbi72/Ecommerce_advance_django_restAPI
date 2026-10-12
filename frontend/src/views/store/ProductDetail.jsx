import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import moment from "moment";
import { CartContext } from "../plugin/Context";
import { ProductDetailSkeleton } from "../components/Skeleton";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  ShoppingCart,
  Heart,
  Star,
  Check,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  RotateCcw,
  User,
  ChevronRight,
  MessageSquare,
  Share2,
  ArrowLeft,
  Store,
  FileText,
  HelpCircle,
  Lock,
} from "lucide-react";
import { showToast } from "../../utils/toast";

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState("");
  const [colorValue, setColorValue] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("spec");

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  const cart_id = CardID();

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => {};

  // Load product details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiInstance
      .get(`products/${slug}/`)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data;
        setProduct(data);
        setActiveImage(data.image);

        if (data.color?.length > 0) {
          setColorValue(data.color[0].name);
        } else {
          setColorValue("No Color");
        }

        if (data.size?.length > 0) {
          setSizeValue(data.size[0].name);
        } else {
          setSizeValue("No Size");
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Product load error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Load reviews when product is available
  useEffect(() => {
    if (!product?.id) return;

    let isMounted = true;
    setReviewLoading(true);

    apiInstance
      .get(`reviews/${product.id}/`)
      .then((res) => {
        if (isMounted) {
          setReviews(Array.isArray(res.data) ? res.data : []);
          setReviewLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Reviews load skipped:", err?.message);
        if (isMounted) setReviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  // Sync wishlist status with backend
  useEffect(() => {
    if (!product?.id || !userData?.user_id) return;

    let isMounted = true;
    apiInstance
      .get(`customer/wishlist/${userData.user_id}/`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const match = res.data.some(
            (item) => item.product?.id === product.id
          );
          setIsWishlisted(match);
        }
      })
      .catch((err) => console.warn("Wishlist sync skipped:", err?.message));

    return () => {
      isMounted = false;
    };
  }, [product?.id, userData?.user_id]);

  // Load related category products
  useEffect(() => {
    if (!product?.id) return;

    let isMounted = true;
    apiInstance
      .get("products/")
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

        const catId = product.category?.id;
        const related = list
          .filter(
            (p) =>
              p.id !== product.id &&
              (p.category?.id === catId || p.category === catId)
          )
          .slice(0, 4);

        setRelatedProducts(related);
      })
      .catch((err) => console.warn("Related products skipped:", err?.message));

    return () => {
      isMounted = false;
    };
  }, [product?.id, product?.category?.id]);

  // Dynamic Warranty Resolver: matches specific product specs first, then categorizes accurately
  const productWarranty = useMemo(() => {
    if (!product) return "Official Brand Warranty";

    // 1. Check custom specification list for Warranty or Guarantee
    if (Array.isArray(product.specification) && product.specification.length > 0) {
      const warrantySpec = product.specification.find((s) => {
        const title = (s?.title || "").toLowerCase();
        return title.includes("warrant") || title.includes("guarantee");
      });
      if (warrantySpec && warrantySpec.content && warrantySpec.content.trim()) {
        return warrantySpec.content.trim();
      }
    }

    // 2. Intelligent fallback based on category and title keywords
    const cat = (product.category?.title || "").toLowerCase();
    const title = (product.title || "").toLowerCase();

    if (
      cat.includes("timepiece") ||
      cat.includes("horology") ||
      title.includes("watch") ||
      title.includes("rolex") ||
      title.includes("omega")
    ) {
      return "2 Year International Horology Warranty";
    }

    if (
      cat.includes("smart") ||
      cat.includes("audio") ||
      cat.includes("headphone") ||
      title.includes("airpods") ||
      title.includes("bose") ||
      title.includes("sony") ||
      title.includes("drone") ||
      title.includes("speaker")
    ) {
      return "1 Year Official Brand Warranty";
    }

    if (
      cat.includes("gaming") ||
      title.includes("ps5") ||
      title.includes("xbox") ||
      title.includes("nintendo") ||
      title.includes("console")
    ) {
      return "1 Year Manufacturer Hardware Warranty";
    }

    if (cat.includes("leather") || cat.includes("bag") || title.includes("wallet")) {
      return "1 Year Craftsmanship Guarantee";
    }

    if (
      cat.includes("fragrance") ||
      cat.includes("grooming") ||
      title.includes("edp") ||
      title.includes("perfume")
    ) {
      return "100% Genuine Sealed Guarantee";
    }

    if (
      cat.includes("apparel") ||
      cat.includes("footwear") ||
      cat.includes("clothing") ||
      title.includes("shoe") ||
      title.includes("jacket")
    ) {
      return "Authenticity & Quality Guarantee";
    }

    return "1 Year Official Warranty";
  }, [product]);

  // Dynamic partial-star renderer
  const renderDynamicStars = (rating, size = "w-4 h-4") => {
    const numericRating = Number(rating) || 0;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((index) => {
          const fillPercentage = Math.max(
            0,
            Math.min(100, (numericRating - (index - 1)) * 100)
          );
          return (
            <div key={index} className={`relative ${size}`}>
              <Star className="w-full h-full text-slate-200 stroke-[1.5]" />
              {fillPercentage > 0 && (
                <div
                  className="absolute top-0 left-0 h-full overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className="w-full h-full fill-amber-400 text-amber-400 stroke-[1.5]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleQuantityAdjust = (delta) => {
    setQuantity((prev) => {
      const maxQty = product?.stock_qty || 99;
      const next = prev + delta;
      return Math.max(1, Math.min(next, maxQty));
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);

    try {
      const formData = new FormData();
      formData.append("product_id", product.id);
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
      formData.append("size", sizeValue || "No Size");
      formData.append("color", colorValue || "No Color");
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

      showToast.success(response.data?.message || "Item added to cart!");
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Error adding item to cart"
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product?.id) return;
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    if (userData?.user_id) {
      try {
        await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
          product_id: product.id,
        });
        if (nextState) {
          showToast.success("Saved to your Wishlist");
        } else {
          showToast.info("Removed from your Wishlist");
        }
      } catch (err) {
        setIsWishlisted(!nextState);
        showToast.error("Could not update Wishlist");
      }
    } else {
      if (nextState) {
        showToast.success("Saved to Wishlist");
      } else {
        showToast.info("Removed from Wishlist");
      }
    }
  };

  const handleShareProduct = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
      showToast.success("Product link copied to clipboard");
    } else {
      showToast.info("Link ready to copy");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast.warning("Please write a review message");
      return;
    }

    if (!userData?.user_id) {
      showToast.info("Please login to submit a review");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formdata = new FormData();
      formdata.append("user_id", userData.user_id);
      formdata.append("product_id", product.id);
      formdata.append("rating", reviewRating);
      formdata.append("review", reviewText);

      await apiInstance.post(`reviews/${product.id}/`, formdata);

      setReviewText("");
      setReviewRating(5);

      // Refresh reviews list
      const res = await apiInstance.get(`reviews/${product.id}/`);
      setReviews(Array.isArray(res.data) ? res.data : []);

      showToast.success("Review submitted successfully!");
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
          "Failed to submit review. Try again."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Product Not Found
        </h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
          The requested product could not be located. It may have been unlisted or removed from the catalog.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md text-decoration-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>
      </div>
    );
  }

  const galleryImages = [
    { image: product.image },
    ...(product.gallery || []),
  ].filter((item) => Boolean(item?.image));

  const hasDiscount =
    product.old_price && Number(product.old_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.old_price) - Number(product.price)) /
          Number(product.old_price)) *
          100
      )
    : 0;

  const currentActiveIdx = galleryImages.findIndex(
    (g) => g.image === (activeImage || product.image)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Header / Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
          <Link
            to="/"
            className="hover:text-indigo-600 transition-colors text-decoration-none flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600">
            {product.category?.title || "Products"}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareProduct}
            aria-label="Share product"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        {/* Left Column: Interactive Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full h-[440px] sm:h-[520px] rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-sm group">
            <ImageWithFallback
              src={activeImage || product.image}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Savings Badge */}
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-500/25 tracking-wide">
                SAVE {discountPercent}%
              </div>
            )}

            {/* Stock Tag Badge */}
            <div className="absolute top-4 right-4">
              {product.in_stock && (product.stock_qty || 1) > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-emerald-700 border border-emerald-100 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {product.stock_qty && product.stock_qty <= 5
                      ? `Only ${product.stock_qty} left`
                      : "In Stock"}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-rose-700 border border-rose-100 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Out of Stock</span>
                </div>
              )}
            </div>

            {/* Gallery Image Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {currentActiveIdx >= 0 ? currentActiveIdx + 1 : 1} / {galleryImages.length}
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
              {galleryImages.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(g.image)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImage === g.image
                      ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-95 shadow-md"
                      : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={g.image}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Specs & Actions */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Metadata Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                {product.category?.title || "Exclusive Item"}
              </span>
              {product.pid && (
                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  PID: #{product.pid}
                </span>
              )}
              {product.vendor?.title && (
                <span className="text-xs font-semibold text-slate-500">
                  by <span className="text-slate-900 font-bold">{product.vendor.title}</span>
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Dynamic Rating Overview */}
            <div className="flex items-center gap-3 pt-1">
              {renderDynamicStars(product.rating || product.product_rating || 5, "w-4 h-4")}
              <span className="text-xs font-extrabold text-slate-800">
                {Number(product.rating || product.product_rating || 5).toFixed(1)}
              </span>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("review");
                  const el = document.getElementById("details-tabs-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </button>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  ${product.price}
                </span>
                {product.old_price &&
                  Number(product.old_price) > Number(product.price) && (
                    <>
                      <span className="text-lg text-slate-400 line-through font-medium">
                        ${product.old_price}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                        Save ${(Number(product.old_price) - Number(product.price)).toFixed(2)}
                      </span>
                    </>
                  )}
              </div>
              <div className="text-[11px] font-medium text-slate-600">
                {Number(product.shipping_amount) === 0
                  ? "Free worldwide express shipping included"
                  : `+$${product.shipping_amount} standard express shipping`}
              </div>
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {product.description}
              </p>
            )}

            {/* Variation: Sizes */}
            {product.size?.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Select Size:{" "}
                    <span className="text-indigo-600 font-bold">{sizeValue}</span>
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.size.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSizeValue(s.name)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        sizeValue === s.name
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variation: Colors */}
            {product.color?.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800">
                  Select Color:{" "}
                  <span className="text-indigo-600 font-bold">{colorValue}</span>
                </span>
                <div className="flex gap-2.5 flex-wrap items-center">
                  {product.color.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColorValue(c.name)}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        colorValue === c.name
                          ? "ring-2 ring-indigo-600 ring-offset-2 scale-105 border-transparent shadow-sm"
                          : "hover:scale-105 border-slate-200"
                      }`}
                      style={{ backgroundColor: c.color_code || "#1e293b" }}
                      title={c.name}
                    >
                      {colorValue === c.name && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & CTA Buttons (No Emojis Anywhere!) */}
            <div className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center justify-between border border-slate-200 rounded-2xl bg-slate-50/80 p-1 w-full sm:w-36 h-12">
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-900 text-sm select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityAdjust(1)}
                    disabled={quantity >= (product.stock_qty || 99)}
                    aria-label="Increase quantity"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !product.in_stock || (product.stock_qty || 1) <= 0}
                  aria-label="Add to Cart"
                  className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md active:scale-[0.98] cursor-pointer ${
                    !product.in_stock || (product.stock_qty || 1) <= 0
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                      : isAddingToCart
                      ? "bg-indigo-600 text-white cursor-wait shadow-lg shadow-indigo-600/30"
                      : "bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 hover:from-indigo-600 hover:via-indigo-600 hover:to-indigo-700 text-white shadow-slate-950/20 hover:shadow-xl hover:shadow-indigo-600/35 border border-white/10 hover:-translate-y-0.5"
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="font-bold tracking-wide">Adding to Cart...</span>
                    </>
                  ) : !product.in_stock || (product.stock_qty || 1) <= 0 ? (
                    <span className="font-semibold text-slate-400">Out of Stock</span>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold tracking-wide">Add to Cart</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                    isWishlisted
                      ? "bg-rose-50 border-rose-200 text-rose-500 shadow-rose-100"
                      : "bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50/30"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isWishlisted ? "fill-rose-500 scale-110" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Value Props & Dynamic Warranty Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 mt-6">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Shipping</div>
                <div className="text-xs font-bold text-slate-900">
                  {Number(product.shipping_amount) === 0 ? "Free Express" : "Fast Tracked"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Warranty</div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {productWarranty}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Returns</div>
                <div className="text-xs font-bold text-slate-900">30-Day Policy</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Authentic</div>
                <div className="text-xs font-bold text-slate-900">100% Genuine</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs Section */}
      <section
        id="details-tabs-section"
        className="mt-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/60 p-2 gap-1.5 scrollbar-none">
          {[
            { id: "spec", label: "Specifications", icon: FileText },
            { id: "vendor", label: "Official Merchant", icon: Store },
            {
              id: "review",
              label: `Reviews (${reviews.length})`,
              icon: MessageSquare,
            },
            { id: "qa", label: "FAQ & Guarantees", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-10">
          {/* Specifications Tab */}
          {activeTab === "spec" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Technical Specifications & Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified product attributes and manufacturer parameters.
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="flex py-3.5 px-5 bg-slate-50/50">
                  <span className="w-1/3 text-xs font-bold text-slate-500">
                    Category
                  </span>
                  <span className="w-2/3 text-xs font-semibold text-slate-900">
                    {product.category?.title || "Standard"}
                  </span>
                </div>

                <div className="flex py-3.5 px-5 bg-white">
                  <span className="w-1/3 text-xs font-bold text-slate-500">
                    Official Warranty
                  </span>
                  <span className="w-2/3 text-xs font-bold text-indigo-700">
                    {productWarranty}
                  </span>
                </div>

                {product.pid && (
                  <div className="flex py-3.5 px-5 bg-slate-50/50">
                    <span className="w-1/3 text-xs font-bold text-slate-500">
                      Product ID (SKU)
                    </span>
                    <span className="w-2/3 text-xs font-mono font-medium text-slate-800">
                      #{product.pid}
                    </span>
                  </div>
                )}

                <div className="flex py-3.5 px-5 bg-white">
                  <span className="w-1/3 text-xs font-bold text-slate-500">
                    Stock Availability
                  </span>
                  <span className="w-2/3 text-xs font-semibold text-slate-900">
                    {product.in_stock && (product.stock_qty || 1) > 0
                      ? `Available (${product.stock_qty || 1} units in warehouse)`
                      : "Out of Stock"}
                  </span>
                </div>

                <div className="flex py-3.5 px-5 bg-slate-50/50">
                  <span className="w-1/3 text-xs font-bold text-slate-500">
                    Shipping & Delivery
                  </span>
                  <span className="w-2/3 text-xs font-semibold text-slate-900">
                    {Number(product.shipping_amount) === 0
                      ? "Free Standard Express Shipping"
                      : `$${product.shipping_amount} Express Courier Delivery`}
                  </span>
                </div>

                {product.specification?.map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex py-3.5 px-5 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <span className="w-1/3 text-xs font-bold text-slate-500">
                      {s.title}
                    </span>
                    <span className="w-2/3 text-xs font-semibold text-slate-900">
                      {s.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Tab */}
          {activeTab === "vendor" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Official Merchant Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified dealer providing authenticity guarantees and expedited handling.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-indigo-50/40 border border-indigo-100 flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-md shadow-indigo-600/20">
                  {product.vendor?.title ? product.vendor.title.charAt(0) : "V"}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {product.vendor?.title || "Luxe Verified Merchant"}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verified Dealer
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Official authorized partner. Each item undergoes strict multi-point authenticity inspection prior to shipping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "review" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Submit Review Column */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Write a Customer Review
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share your experience with other shoppers.
                  </p>
                </div>

                <form
                  onSubmit={handleReviewSubmit}
                  className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (reviewHoverRating || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your detailed thoughts on quality, packaging, and performance..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmittingReview ? "Posting Review..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* Existing Reviews Column */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Customer Feedback ({reviews.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real reviews from verified purchases.
                  </p>
                </div>

                {reviewLoading ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Loading customer reviews...
                  </p>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                    <MessageSquare className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      No customer reviews yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Be the first to review this product and help other customers!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                              {r.profile?.image ? (
                                <img
                                  src={r.profile.image}
                                  alt="User"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">
                                {r.profile?.full_name || "Verified Customer"}
                              </h5>
                              <span className="text-[10px] text-slate-400">
                                {moment(r.date).format("MMM DD, YYYY")}
                              </span>
                            </div>
                          </div>

                          <div>{renderDynamicStars(r.rating || 5, "w-3.5 h-3.5")}</div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pl-12">
                          {r.review}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QA Tab with Product-Specific Warranty */}
          {activeTab === "qa" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Frequently Asked Questions & Coverage
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Details regarding warranty coverage, dispatch speed, and returns.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 mb-1">
                    What is the warranty coverage for this product?
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This item includes an official <span className="font-bold text-slate-900">{productWarranty}</span>. If you experience any manufacturing defects or functional issues during this period, support and repairs are handled with priority.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 mb-1">
                    How long does shipping take?
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Orders are packaged and dispatched within 24 hours. Express transit takes between 2 to 4 business days with full online tracking provided via your email.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 mb-1">
                    What is your 30-day return policy?
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You can return eligible items within 30 days of delivery directly through your customer dashboard. Returns are hassle-free with full refund processing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Products Strip */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Recommended From This Category
              </h3>
              <p className="text-xs text-slate-500">
                Other popular choices you might find interesting.
              </p>
            </div>
            <Link
              to="/"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 text-decoration-none"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/detail/${rel.slug}/`}
                className="group bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between text-decoration-none"
              >
                <div>
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3">
                    <ImageWithFallback
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {rel.title}
                  </h4>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    ${rel.price}
                  </span>
                  {renderDynamicStars(rel.rating || rel.product_rating || 5, "w-3 h-3")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
