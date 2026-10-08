import { useEffect, useState, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiInstance from "../../utils/axios";
import GetCurrentAddress from "../plugin/UserCountry";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import Swal from "sweetalert2";
import { CartContext } from "../plugin/Context";
import { ProductCardSkeleton } from "../components/Skeleton";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  Search as SearchIcon,
  ShoppingCart,
  Heart,
  Star,
  Check,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import { showToast } from "../../utils/toast";

const Search = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [wishlist, setWishlist] = useState({});
  const [addingToCart, setAddingToCart] = useState({});

  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  const cart_id = CardID();

  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => {};

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiInstance
      .get(`search/?query=${encodeURIComponent(query)}`)
      .then((res) => {
        if (isMounted) {
          setProducts(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Search error:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

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

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const next = !prev[productId];
      if (next) {
        showToast.success("Added to Wishlist");
      } else {
        showToast.info("Removed from Wishlist");
      }
      return { ...prev, [productId]: next };
    });
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

      showToast.success(response.data?.message || "Added to cart!");
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="max-w-screen-4k mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-10">
      {/* Search Header Banner */}
      <div className="mb-8 p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 block mb-1">
            Search Discovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Results for: &ldquo;{query}&rdquo;
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Showing all matching products from verified designers.
          </p>
        </div>
        <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-semibold backdrop-blur-md">
          {products.length} Products Found
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <ProductCardSkeleton key={n} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <SearchIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No matching products
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            We couldn't find any products matching &ldquo;{query}&rdquo;. Try another search term or browse our catalog.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold text-decoration-none shadow-sm transition-all"
          >
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-6 gap-6">
          {products.map((p) => {
            const currentQty = selectedQuantities[p.id] || 1;
            const activeColor =
              selectedColors[p.id] ||
              (p.color?.length > 0 ? p.color[0].name : "No Color");
            const activeSize =
              selectedSizes[p.id] ||
              (p.size?.length > 0 ? p.size[0].name : "No Size");
            const isWishlisted = Boolean(wishlist[p.id]);
            const isAdding = Boolean(addingToCart[p.id]);

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-50 mb-4">
                    <Link to={`/detail/${p?.slug}/`}>
                      <ImageWithFallback
                        src={p?.image}
                        alt={p?.title || "Product"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isWishlisted
                          ? "bg-rose-50 text-rose-500"
                          : "bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 shadow-sm"
                      }`}
                      aria-label="Save to Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted ? "fill-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {p.category?.title || "Exclusive"}
                    </span>
                    <div className="flex items-center text-amber-500 text-xs gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-700">
                        {p.rating || "4.8"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/detail/${p?.slug}/`}
                    className="text-decoration-none"
                  >
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {p?.title}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-extrabold text-slate-900">
                      ${p?.price}
                    </span>
                    {p?.old_price && (
                      <span className="text-xs text-slate-400 line-through">
                        ${p?.old_price}
                      </span>
                    )}
                  </div>

                  {(p.size?.length > 0 || p.color?.length > 0) && (
                    <div className="space-y-2 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      {p.size?.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Size:
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {p.size.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSizeSelect(p.id, s.name)}
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                                  activeSize === s.name
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200"
                                }`}
                              >
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.color?.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Color:
                          </span>
                          <div className="flex gap-1.5 flex-wrap justify-end">
                            {p.color.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleColorSelect(p.id, c.name)}
                                className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                                  activeColor === c.name
                                    ? "ring-2 ring-indigo-500 ring-offset-1 scale-110"
                                    : "hover:scale-110"
                                }`}
                                style={{
                                  backgroundColor: c.color_code || "#000",
                                }}
                                title={c.name}
                              >
                                {activeColor === c.name && (
                                  <Check className="w-2.5 h-2.5 text-white mix-blend-difference" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-1 py-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(p.id, -1)}
                        className="p-1 hover:text-indigo-600 rounded"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(p.id, 1)}
                        className="p-1 hover:text-indigo-600 rounded"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      disabled={isAdding}
                      className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;
