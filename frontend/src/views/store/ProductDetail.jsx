import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import Swal from "sweetalert2";
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
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  const cart_id = CardID();

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => { };

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

  const handleQuantityAdjust = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
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
      showToast.error(error.response?.data?.message || "Error adding item to cart");
    } finally {
      setIsAddingToCart(false);
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
      <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Product Not Found
        </h2>
        <p className="text-slate-500 mb-6">
          The requested product could not be found or has been removed.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold text-decoration-none"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const galleryImages = [
    { image: product.image },
    ...(product.gallery || []),
  ].filter((item) => Boolean(item?.image));

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8">
        <Link to="/" className="hover:text-indigo-600 text-decoration-none">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">
          {product.category?.title || "Products"}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
        {/* Left Column: Interactive Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm">
            <ImageWithFallback
              src={activeImage || product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.old_price &&
              Number(product.old_price) > Number(product.price) && (
                <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  SAVE{" "}
                  {Math.round(
                    ((Number(product.old_price) - Number(product.price)) /
                      Number(product.old_price)) *
                    100
                  )}
                  %
                </span>
              )}
          </div>

          {/* Thumbnails strip */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {galleryImages.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(g.image)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === g.image
                      ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-95"
                      : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                >
                  <img
                    src={g.image}
                    alt={`Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information, Pricing & Add-to-cart */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              {product.category?.title || "Exclusive Design"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Rating overview */}
          <div className="flex items-center gap-3">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= (product.rating || 4)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                    }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {product.rating || "4.8"} / 5.0
            </span>
            <span className="text-xs text-slate-400">
              ({reviews.length} customer reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 pb-2 border-b border-slate-100">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              ${product.price}
            </span>
            {product.old_price && (
              <span className="text-lg text-slate-400 line-through">
                ${product.old_price}
              </span>
            )}
          </div>

          {/* Short description */}
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Variation: Sizes */}
          {product.size?.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Select Size:{" "}
                  <span className="text-indigo-600 font-normal">
                    {sizeValue}
                  </span>
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.size.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSizeValue(s.name)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${sizeValue === s.name
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
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-800">
                Select Color:{" "}
                <span className="text-indigo-600 font-normal">
                  {colorValue}
                </span>
              </span>
              <div className="flex gap-2.5 flex-wrap">
                {product.color.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setColorValue(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${colorValue === c.name
                        ? "ring-2 ring-indigo-600 ring-offset-2 scale-110"
                        : "hover:scale-105 border-slate-200"
                      }`}
                    style={{ backgroundColor: c.color_code || "#000" }}
                    title={c.name}
                  >
                    {colorValue === c.name && (
                      <Check className="w-4 h-4 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Button */}
          <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Stepper */}
              <div
                className="flex items-center justify-between border border-slate-200 rounded-full bg-slate-50 p-1 w-full sm:w-36"
                style={{ borderRadius: "9999px" }}
              >
                <button
                  type="button"
                  onClick={() => handleQuantityAdjust(-1)}
                  style={{ borderRadius: "9999px" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 transition-colors shadow-xs cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-900 text-sm select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityAdjust(1)}
                  style={{ borderRadius: "9999px" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                style={{ borderRadius: "9999px" }}
                className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer min-h-[48px]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
                </span>
              </button>

              {/* Wishlist toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextWish = !isWishlisted;
                  setIsWishlisted(nextWish);
                  if (nextWish) {
                    showToast.success("Saved to wishlist");
                  } else {
                    showToast.info("Removed from wishlist");
                  }
                }}
                style={{ borderRadius: "9999px" }}
                className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center cursor-pointer shrink-0 ${isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-500"
                    : "border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50/50"
                  }`}
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Benefits summary list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Worldwide Express</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>2 Year Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>30 Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mt-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          {[
            { id: "spec", label: "Specifications" },
            { id: "vendor", label: "Vendor & Brand" },
            { id: "review", label: `Reviews (${reviews.length})` },
            { id: "qa", label: "Questions & Answers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {/* Specifications Tab */}
          {activeTab === "spec" && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Technical Specifications
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex py-3 px-4 bg-slate-50/50">
                  <span className="w-1/3 text-xs font-semibold text-slate-500">
                    Category
                  </span>
                  <span className="w-2/3 text-xs font-medium text-slate-800">
                    {product.category?.title || "Standard"}
                  </span>
                </div>
                {product.specification?.map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex py-3 px-4 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                  >
                    <span className="w-1/3 text-xs font-semibold text-slate-500">
                      {s.title}
                    </span>
                    <span className="w-2/3 text-xs font-medium text-slate-800">
                      {s.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Tab */}
          {activeTab === "vendor" && (
            <div className="max-w-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Official Merchant Info
              </h3>
              <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {product.vendor?.title
                    ? product.vendor.title.charAt(0)
                    : "L"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {product.vendor?.title || "Luxe Verified Merchant"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Verified authorized dealer. All items undergo 5-point
                    quality verification before shipping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "review" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Submit Review Column */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Write a Customer Review
                </h3>
                <form
                  onSubmit={handleReviewSubmit}
                  className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= reviewRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                              }`}
                          />
                        </button>
                      ))}
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
                      placeholder="Share your experience with this item..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    {isSubmittingReview ? "Posting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* Existing Reviews Column */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Customer Feedback ({reviews.length})
                </h3>

                {reviewLoading ? (
                  <p className="text-xs text-slate-400">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      Be the first to review this product!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
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
                                {r.profile?.full_name || "Verified Buyer"}
                              </h5>
                              <span className="text-[10px] text-slate-400">
                                {moment(r.date).format("MMM DD, YYYY")}
                              </span>
                            </div>
                          </div>

                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= (r.rating || 5)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pl-10">
                          {r.review}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QA Tab */}
          {activeTab === "qa" && (
            <div className="max-w-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    Q: Is international express shipping supported?
                  </p>
                  <p className="text-xs text-slate-600">
                    A: Yes! Orders are shipped via DHL/FedEx Express with end-to-end tracking provided immediately after fulfillment.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    Q: What is the warranty & return process?
                  </p>
                  <p className="text-xs text-slate-600">
                    A: You can initiate a free return within 30 days of receiving your item directly through your Account dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
