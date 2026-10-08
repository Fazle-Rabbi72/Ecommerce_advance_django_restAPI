import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import CardID from "../plugin/CardID";
import GetCurrentAddress from "../plugin/UserCountry";
import { CartContext } from "../plugin/Context";
import { showToast } from "../../utils/toast";
import ImageWithFallback from "../components/ImageWithFallback";
import Sidebar from "./Sidebar";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Star,
  Package,
  ShieldCheck,
} from "lucide-react";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

  const userData = UserData();
  const cart_id = CardID();
  const currentAddress = GetCurrentAddress();

  const cartContextVal = useContext(CartContext);
  const setCartCount = Array.isArray(cartContextVal)
    ? cartContextVal[1]
    : () => {};

  const fetchWishlist = async () => {
    if (!userData?.user_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiInstance.get(`customer/wishlist/${userData.user_id}/`);
      setWishlist(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [userData?.user_id]);

  const handleRemoveFromWishlist = async (productId) => {
    if (!userData?.user_id) return;
    try {
      await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
        product_id: productId,
        user_id: userData.user_id,
      });
      showToast.info("Item removed from your wishlist");
      setWishlist((prev) => prev.filter((item) => item.product?.id !== productId));
    } catch (err) {
      showToast.error("Failed to remove item");
    }
  };

  const handleMoveToCart = async (product) => {
    const productId = product.id;
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));

    try {
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("user_id", userData?.user_id || 0);
      formData.append("quantity", 1);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount || 0);
      formData.append(
        "country",
        typeof currentAddress === "object"
          ? currentAddress.country || "United States"
          : currentAddress || "United States"
      );
      formData.append(
        "size",
        product.size?.length > 0 ? product.size[0].name : "No Size"
      );
      formData.append(
        "color",
        product.color?.length > 0 ? product.color[0].name : "No Color"
      );
      formData.append("cart_id", cart_id);

      await apiInstance.post("cart-view/", formData);

      // Update cart count
      const url = userData?.user_id
        ? `/cart-list/${cart_id}/${userData.user_id}/`
        : `/cart-list/${cart_id}/`;
      const listRes = await apiInstance.get(url);
      if (Array.isArray(listRes.data)) {
        setCartCount(listRes.data.length);
      }

      showToast.success("Moved to Cart!");
      // Optionally remove from wishlist
      handleRemoveFromWishlist(productId);
    } catch (err) {
      showToast.error("Could not add to cart");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-12 2xl:px-16 max-w-screen-4k mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Customer Sidebar */}
        <Sidebar />

        {/* Wishlist Main Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Heart className="w-3.5 h-3.5 fill-rose-500" /> My Saved Items
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Favorite Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Products you have saved for later. Move them directly to your cart with one click.
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-extrabold text-slate-900 block">
                {wishlist.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Saved Items</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="w-full h-48 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">
                Your wishlist is empty
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Explore our catalog and click the heart icon on any product to save it here.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 text-decoration-none"
              >
                Discover Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {wishlist.map((item) => {
                const p = item.product;
                if (!p) return null;
                const isAdding = addingToCart[p.id];
                return (
                  <div
                    key={item.id || p.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-50 mb-3">
                        <Link to={`/detail/${p.slug}/`}>
                          <ImageWithFallback
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromWishlist(p.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center shadow-sm transition-all"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Category & Rating */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {p.category?.title || "Exclusive"}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold text-slate-700">{p.rating || "4.9"}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link
                        to={`/detail/${p.slug}/`}
                        className="text-decoration-none"
                      >
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                          {p.title}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-base font-extrabold text-slate-900">
                          ${p.price}
                        </span>
                        {p.old_price && (
                          <span className="text-xs text-slate-400 line-through">
                            ${p.old_price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Move to Cart */}
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(p)}
                      disabled={isAdding}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isAdding ? "Moving..." : "Move to Cart"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
