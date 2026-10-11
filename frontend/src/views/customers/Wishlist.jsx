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
  RotateCcw,
} from "lucide-react";
import { Button, EmptyState } from "../components/ui";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [lastRemovedItem, setLastRemovedItem] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.user_id]);

  const handleRemoveFromWishlist = async (product, showUndo = true) => {
    if (!userData?.user_id || !product) return;
    const productId = product.id;

    // Optimistic UI removal
    const previousList = [...wishlist];
    setWishlist((prev) => prev.filter((item) => item.product?.id !== productId));
    if (showUndo) setLastRemovedItem(product);

    try {
      await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
        product_id: productId,
        user_id: userData.user_id,
      });

      if (showUndo) {
        showToast.info(`"${product.title}" removed from wishlist.`);
      }
    } catch (_err) {
      // Rollback on failure
      setWishlist(previousList);
      showToast.error("Failed to remove item from wishlist");
    }
  };

  const handleUndoRemove = async () => {
    if (!lastRemovedItem || !userData?.user_id) return;
    const itemToRestore = lastRemovedItem;
    setLastRemovedItem(null);

    // Optimistic restore
    setWishlist((prev) => [...prev, { product: itemToRestore }]);

    try {
      await apiInstance.post(`customer/wishlist/${userData.user_id}/`, {
        product_id: itemToRestore.id,
        user_id: userData.user_id,
      });
      showToast.success(`Restored "${itemToRestore.title}" to wishlist!`);
    } catch (_err) {
      showToast.error("Could not restore item");
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

      showToast.success(`"${product.title}" moved to cart!`);
      // Remove from wishlist silently without undo prompt
      handleRemoveFromWishlist(product, false);
    } catch (_err) {
      showToast.error("Could not add to cart");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10 pb-24 md:pb-10 px-4 sm:px-6 lg:px-12 2xl:px-16 max-w-screen-4k mx-auto">
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
                Products you have saved for later. Move them directly to your cart with one tap.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl font-extrabold text-slate-900 block">
                {wishlist.length}
              </span>
              <span className="text-xs text-slate-400">Total Saved Products</span>
            </div>
          </div>

          {/* UNDO BANNER TOAST */}
          {lastRemovedItem && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
              <span className="text-xs text-slate-200 truncate">
                Removed <strong className="text-white">"{lastRemovedItem.title}"</strong>
              </span>
              <button
                type="button"
                onClick={handleUndoRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </button>
            </div>
          )}

          {/* Grid of Wishlist Products */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-4"
                >
                  <div className="w-full h-48 bg-slate-100 rounded-2xl" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your Wishlist is Empty"
              description="Save items you love by tapping the heart icon on any product page."
              actionLabel="Explore Axura Collection"
              actionHref="/"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlist.map((item) => {
                const product = item.product;
                if (!product) return null;
                const isAdding = Boolean(addingToCart[product.id]);

                return (
                  <div
                    key={item.id || product.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between group hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="relative w-full h-52 rounded-2xl bg-slate-100 overflow-hidden mb-4">
                        <Link to={`/detail/${product.slug}/`}>
                          <ImageWithFallback
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromWishlist(product)}
                          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-600 hover:bg-white shadow-sm flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
                          aria-label={`Remove ${product.title} from wishlist`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {product.category?.title || "Axura Luxury"}
                        </span>
                        <Link
                          to={`/detail/${product.slug}/`}
                          className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1 block text-decoration-none transition-colors"
                        >
                          {product.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-base font-extrabold text-slate-900">
                          ${product.price}
                        </span>
                        {product.old_price && (
                          <span className="text-xs text-slate-400 line-through">
                            ${product.old_price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Move to Cart 1-Tap Action */}
                    <div className="pt-2 border-t border-slate-100">
                      <Button
                        variant="primary"
                        onClick={() => handleMoveToCart(product)}
                        loading={isAdding}
                        className="w-full min-h-[44px]"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Move to Cart
                      </Button>
                    </div>
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
