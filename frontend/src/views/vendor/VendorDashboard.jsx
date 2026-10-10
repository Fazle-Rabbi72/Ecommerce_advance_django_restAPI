import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import { showToast } from "../../utils/toast";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  Store,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUpRight,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  Send,
  SlidersHorizontal,
  ExternalLink,
  Palette,
  Layers,
  Image as ImageIcon,
  FileText,
  Upload,
} from "lucide-react";

const VendorDashboard = () => {
  const userData = UserData();
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, orders, wallet

  // Vendor Auth & Status State
  const [vendorAuthLoading, setVendorAuthLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Apply to become vendor form state
  const [applyShopName, setApplyShopName] = useState("");
  const [applyMobile, setApplyMobile] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [submittingApply, setSubmittingApply] = useState(false);

  // Dashboard Stats State
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    gross_revenue: 0,
    admin_commission: 0,
    commission_rate: "0.1%",
    net_earnings: 0,
    total_paid_out: 0,
    pending_payout: 0,
    available_balance: 0,
    vendor_name: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    routing_number: "",
    mobile_banking_provider: "",
    mobile_banking_number: "",
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Products State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  // Payouts State
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
    routing_number: "",
    mobile_banking_provider: "bKash",
    mobile_banking_number: "",
  });
  const [savingBank, setSavingBank] = useState(false);

  // Add / Edit Product Modal State (Full variation support matching Admin)
  const initialProductForm = {
    title: "",
    category_id: "",
    price: "",
    old_price: "",
    shipping_amount: "0.00",
    stock_qty: 15,
    description: "",
    image: "",
    status: "published",
    featured: false,
    gallery: [],
    colors: [{ name: "Standard", color_code: "#000000" }],
    sizes: [{ name: "Standard", price: "0.00" }],
    specifications: [{ title: "Warranty", content: "1 Year Official" }],
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // 1. Check if user is a vendor
  const checkVendorStatus = async () => {
    setVendorAuthLoading(true);
    try {
      const res = await apiInstance.get("vendor/me/");
      if (res.data.is_vendor) {
        setIsVendor(true);
        setVendorData(res.data);
        fetchVendorData(res.data.vendor_id);
      } else {
        setIsVendor(false);
        setHasPendingRequest(res.data.has_pending_request || false);
      }
    } catch (err) {
      console.error("Failed to check vendor status:", err);
      // Fallback: check if user has admin/vendor data
      setIsVendor(false);
    } finally {
      setVendorAuthLoading(false);
    }
  };

  // Submit vendor onboarding application
  const handleApplyVendor = async (e) => {
    e.preventDefault();
    if (!applyShopName.trim()) {
      showToast.error("Please enter your Shop or Brand Name.");
      return;
    }

    setSubmittingApply(true);
    try {
      const res = await apiInstance.post("vendor/request/", {
        shop_name: applyShopName,
        mobile: applyMobile,
        message: applyMessage,
      });
      showToast.success(res.data?.message || "Vendor application submitted successfully!");
      setHasPendingRequest(true);
      checkVendorStatus();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to submit vendor application. Please try again.";
      showToast.error(errMsg);
    } finally {
      setSubmittingApply(false);
    }
  };

  useEffect(() => {
    checkVendorStatus();
    // Fetch categories for product form
    apiInstance
      .get("category/")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Fetch all vendor data once authenticated
  const fetchVendorData = (vendorId) => {
    if (!vendorId) return;
    fetchStats(vendorId);
    fetchProducts(vendorId);
    fetchOrders(vendorId);
    fetchPayouts(vendorId);
  };

  const fetchStats = async (vendorId) => {
    setLoadingStats(true);
    try {
      const res = await apiInstance.get(`vendor/stats/${vendorId}/`);
      setStats(res.data);
      setBankForm({
        bank_name: res.data.bank_name || "",
        account_number: res.data.account_number || "",
        account_name: res.data.account_name || "",
        routing_number: res.data.routing_number || "",
        mobile_banking_provider: res.data.mobile_banking_provider || "bKash",
        mobile_banking_number: res.data.mobile_banking_number || "",
      });
    } catch (err) {
      console.error("Failed to fetch vendor stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchProducts = async (vendorId) => {
    setLoadingProducts(true);
    try {
      const res = await apiInstance.get(`vendor-product/${vendorId}/`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async (vendorId) => {
    setLoadingOrders(true);
    try {
      const res = await apiInstance.get(`vendor/orders-list/${vendorId}/`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPayouts = async (vendorId) => {
    setLoadingPayouts(true);
    try {
      const res = await apiInstance.get(`vendor/payouts/${vendorId}/`);
      setPayouts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch payouts:", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Save Bank Settings
  const handleSaveBankSettings = async (e) => {
    e.preventDefault();
    if (!vendorData?.vendor_id) return;
    setSavingBank(true);
    try {
      await apiInstance.patch(`vendor/bank-settings/${vendorData.vendor_id}/`, bankForm);
      showToast.success("Payout and bank details updated successfully!");
      fetchStats(vendorData.vendor_id);
    } catch (err) {
      showToast.error("Failed to save bank details.");
    } finally {
      setSavingBank(false);
    }
  };

  // Submit Payout / Withdrawal Request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (!amountNum || amountNum <= 0) {
      showToast.error("Please enter a valid amount.");
      return;
    }
    if (amountNum > stats.available_balance) {
      showToast.error(
        `Insufficient balance! Maximum available: $${stats.available_balance.toFixed(2)}`
      );
      return;
    }

    setSubmittingPayout(true);
    try {
      await apiInstance.post(`vendor/payouts/${vendorData.vendor_id}/`, {
        amount: amountNum,
        payout_method: payoutMethod,
        account_details:
          payoutMethod === "Bank Transfer"
            ? `${bankForm.bank_name} - ${bankForm.account_number} (${bankForm.account_name})`
            : `${bankForm.mobile_banking_provider}: ${bankForm.mobile_banking_number}`,
      });
      showToast.success("Payout request submitted! Admin will process payment.");
      setShowPayoutModal(false);
      setPayoutAmount("");
      fetchStats(vendorData.vendor_id);
      fetchPayouts(vendorData.vendor_id);
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to submit payout request.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  // --- Cloudinary Image Upload Helpers ---
  const handleUploadSingleImage = async (file, onUploaded, setLoading, folder = "products") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast.warning("Please choose a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast.warning("Image file size should be less than 12MB");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    try {
      const res = await apiInstance.post("upload-image/", formData);
      if (res.data?.url) {
        onUploaded(res.data.url);
        showToast.success("Image uploaded to Cloudinary successfully!");
      } else {
        showToast.error("Failed to retrieve uploaded image URL");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast.error(err.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadGalleryFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      showToast.warning("Please select valid image files");
      return;
    }

    setUploadingGallery(true);
    const formData = new FormData();
    validFiles.forEach((file) => formData.append("images", file));
    formData.append("folder", "products/gallery");

    try {
      const res = await apiInstance.post("upload-image/", formData);
      const newUrls = res.data?.urls || (res.data?.url ? [res.data.url] : []);
      if (newUrls.length > 0) {
        const existing = (productForm.gallery || []).filter((g) => Boolean(g && g.trim()));
        setProductForm((prev) => ({
          ...prev,
          gallery: [...existing, ...newUrls],
        }));
        showToast.success(`${newUrls.length} gallery image(s) uploaded!`);
      }
    } catch (err) {
      console.error("Gallery upload failed:", err);
      showToast.error(err.response?.data?.message || "Failed to upload gallery images");
    } finally {
      setUploadingGallery(false);
    }
  };

  // --- Dynamic Form Array Helpers (Gallery, Colors, Sizes, Specs) ---
  const handleGalleryChange = (index, value) => {
    const updated = [...(productForm.gallery || [])];
    updated[index] = value;
    setProductForm({ ...productForm, gallery: updated });
  };

  const handleAddGalleryItem = () => {
    setProductForm({
      ...productForm,
      gallery: [...(productForm.gallery || []), ""],
    });
  };

  const handleRemoveGalleryItem = (index) => {
    setProductForm((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index),
    }));
  };

  // Color Handlers
  const handleColorChange = (index, field, value) => {
    const updated = [...(productForm.colors || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProductForm({ ...productForm, colors: updated });
  };

  const handleAddColorItem = () => {
    const newItem = { name: "", color_code: "#4f46e5" };
    setProductForm({
      ...productForm,
      colors: [...(productForm.colors || []), newItem],
    });
  };

  const handleRemoveColorItem = (index) => {
    setProductForm({
      ...productForm,
      colors: (productForm.colors || []).filter((_, i) => i !== index),
    });
  };

  // Size Handlers
  const handleSizeChange = (index, field, value) => {
    const updated = [...(productForm.sizes || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProductForm({ ...productForm, sizes: updated });
  };

  const handleAddSizeItem = () => {
    const newItem = { name: "", price: "0.00" };
    setProductForm({
      ...productForm,
      sizes: [...(productForm.sizes || []), newItem],
    });
  };

  const handleRemoveSizeItem = (index) => {
    setProductForm({
      ...productForm,
      sizes: (productForm.sizes || []).filter((_, i) => i !== index),
    });
  };

  // Specification Handlers
  const handleSpecChange = (index, field, value) => {
    const updated = [...(productForm.specifications || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProductForm({ ...productForm, specifications: updated });
  };

  const handleAddSpecItem = () => {
    const newItem = { title: "", content: "" };
    setProductForm({
      ...productForm,
      specifications: [...(productForm.specifications || []), newItem],
    });
  };

  const handleRemoveSpecItem = (index) => {
    setProductForm({
      ...productForm,
      specifications: (productForm.specifications || []).filter((_, i) => i !== index),
    });
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductForm({
      ...initialProductForm,
      category_id: categories[0]?.id || "",
    });
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod.pid || prod.id);
    setProductForm({
      title: prod.title || "",
      category_id: prod.category?.id || prod.category || "",
      price: prod.price || "",
      old_price: prod.old_price || "",
      shipping_amount: prod.shipping_amount || "0.00",
      stock_qty: prod.stock_qty || 10,
      description: prod.description || "",
      image: prod.image || "",
      status: prod.status || "published",
      featured: Boolean(prod.featured),
      gallery: (prod.gallery || [])
        .map((g) => (typeof g === "string" ? g : g.image || ""))
        .filter((g) => Boolean(g && g.trim())),
      colors: (prod.color || prod.colors || []).length > 0
        ? (prod.color || prod.colors).map((c) => ({
            name: c.name || "",
            color_code: c.color_code || "#000000",
          }))
        : [{ name: "Standard", color_code: "#000000" }],
      sizes: (prod.size || prod.sizes || []).length > 0
        ? (prod.size || prod.sizes).map((s) => ({
            name: s.name || "",
            price: s.price || "0.00",
          }))
        : [{ name: "Standard", price: "0.00" }],
      specifications: (prod.specification || prod.specifications || []).length > 0
        ? (prod.specification || prod.specifications).map((sp) => ({
            title: sp.title || "",
            content: sp.content || "",
          }))
        : [{ title: "Warranty", content: "1 Year Official" }],
    });
    setShowProductModal(true);
  };

  // Submit Add or Edit Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      showToast.error("Please provide title and price.");
      return;
    }

    setSubmittingProduct(true);
    const payload = {
      ...productForm,
      category_id: productForm.category_id || null,
      gallery: (productForm.gallery || []).filter((g) => Boolean(g && (typeof g === "string" ? g.trim() : g))),
      colors: (productForm.colors || []).filter((c) => Boolean(c.name && c.name.trim())),
      sizes: (productForm.sizes || []).filter((s) => Boolean(s.name && s.name.trim())),
      specifications: (productForm.specifications || []).filter(
        (sp) => Boolean(sp.title && sp.title.trim())
      ),
      vendor_id: vendorData?.vendor_id,
    };

    try {
      if (editingProductId) {
        await apiInstance.patch(
          `vendor-update-product/${vendorData?.vendor_id}/${editingProductId}/`,
          payload
        );
        showToast.success("Product updated successfully with all variations!");
      } else {
        await apiInstance.post("vendor-create-product/", payload);
        showToast.success("Product created successfully with all variations!");
      }

      setShowProductModal(false);
      setProductForm(initialProductForm);
      fetchProducts(vendorData?.vendor_id);
      fetchStats(vendorData?.vendor_id);
    } catch (err) {
      console.error("Save product error:", err);
      showToast.error(
        err.response?.data?.message || "Failed to save product. Check inputs."
      );
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prodPid) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiInstance.delete(
        `vendor-update-product/${vendorData?.vendor_id}/${prodPid}/`
      );
      showToast.success("Product removed.");
      fetchProducts(vendorData?.vendor_id);
      fetchStats(vendorData?.vendor_id);
    } catch (err) {
      showToast.error("Could not delete product.");
    }
  };

  // -------------------------------------------------------------
  // RENDERING: Loading State
  // -------------------------------------------------------------
  if (vendorAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-semibold text-sm">
            Loading Vendor Portal...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING: Non-Vendor / Application Screen
  // -------------------------------------------------------------
  if (!isVendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" /> Multi-Vendor Marketplace
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Become a Verified Seller
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Open your digital storefront today. Manage product inventory, reach
                millions of buyers, and enjoy our industry-lowest{" "}
                <strong className="text-emerald-400">0.1% platform fee</strong> with
                guaranteed automated payouts!
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {hasPendingRequest ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                <Clock className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-900">
                    Application Under Review
                  </h3>
                  <p className="text-sm text-amber-800">
                    Your vendor application has been received and is currently being
                    reviewed by our marketplace admin. Once approved, your seller
                    dashboard will unlock automatically!
                  </p>
                  <button
                    onClick={checkVendorStatus}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Check Approval Status
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyVendor} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Lowest 0.1% Fee
                    </h4>
                    <p className="text-xs text-slate-500">
                      Keep 99.9% of your sales revenue. Transparent breakdown on every
                      order.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Direct Payouts
                    </h4>
                    <p className="text-xs text-slate-500">
                      Withdraw your earnings straight into your Bank or mobile wallet
                      anytime.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Full Autonomy
                    </h4>
                    <p className="text-xs text-slate-500">
                      Upload products, set discounts, track inventory, and handle orders
                      with ease.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      Shop / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applyShopName}
                      onChange={(e) => setApplyShopName(e.target.value)}
                      placeholder="e.g. Apex Electronics & Gadgets"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs sm:text-sm transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                      Contact / Phone Number
                    </label>
                    <input
                      type="text"
                      value={applyMobile}
                      onChange={(e) => setApplyMobile(e.target.value)}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs sm:text-sm transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tell us about your shop & products (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="e.g. We specialize in authentic accessories, headphones, and home gadgets with 50+ SKU inventory..."
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs sm:text-sm transition-all text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingApply}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submittingApply
                      ? "Submitting Application..."
                      : "Submit Seller Application"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title
      ?.toLowerCase()
      .includes(productSearch.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    return (
      o.order_oid?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.buyer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.product_title?.toLowerCase().includes(orderSearch.toLowerCase())
    );
  });

  // -------------------------------------------------------------
  // RENDERING: Full Multi-Vendor Dashboard
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-indigo-500/30">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {stats.vendor_name || "My Seller Store"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Vendor
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Storefront ID:{" "}
              <span className="font-mono text-slate-700">
                #{vendorData?.vendor_id}
              </span>{" "}
              • Marketplace Fee:{" "}
              <strong className="text-emerald-700">0.1% per sold item</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchVendorData(vendorData?.vendor_id)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => {
              setActiveTab("wallet");
              setShowPayoutModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Withdraw Earnings</span>
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards (0.1% Commission Breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Gross Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${stats.gross_revenue.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-500">
              Total volume from {stats.orders} paid order(s)
            </p>
          </div>
        </div>

        {/* 0.1% Admin Commission */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admin Commission
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
              0.1% Rate
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              ${stats.admin_commission.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-500">
              Automatically retained platform fee
            </p>
          </div>
        </div>

        {/* Net Vendor Earnings */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Net Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              ${stats.net_earnings.toFixed(2)}
            </h3>
            <p className="text-[11px] text-emerald-800/80">
              99.9% of your total product sales
            </p>
          </div>
        </div>

        {/* Available for Payout */}
        <div className="bg-white rounded-3xl p-6 border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">
              ${stats.available_balance.toFixed(2)}
            </h3>
            <p className="text-[11px] text-indigo-700/80">
              Withdrawable to Bank or Mobile wallet
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          📈 Store Overview
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "products"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Products ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "orders"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "wallet"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Wallet & Payouts ({payouts.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Snapshot Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" /> Store Profile
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Shop Name</span>
                  <span className="font-bold text-slate-800">
                    {stats.vendor_name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Live Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active & Verified
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Commission Plan</span>
                  <span className="font-bold text-slate-800">0.1% Flat Fee</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Paid Out</span>
                  <span className="font-bold text-slate-800">
                    ${stats.total_paid_out.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Pending Withdrawals</span>
                  <span className="font-bold text-amber-600">
                    ${stats.pending_payout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> Recent
                  Sales & Earnings
                </h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View All Orders <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No orders recorded yet. When customers buy your products, they
                  will appear here!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Qty</th>
                        <th className="pb-3">Sale Price</th>
                        <th className="pb-3 text-amber-600">0.1% Fee</th>
                        <th className="pb-3 text-emerald-600">Net Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80">
                          <td className="py-3 font-mono font-bold text-slate-800">
                            #{ord.order_oid}
                          </td>
                          <td className="py-3 text-slate-800 truncate max-w-[150px]">
                            {ord.product_title}
                          </td>
                          <td className="py-3">{ord.quantity}</td>
                          <td className="py-3 font-bold text-slate-900">
                            ${ord.sub_total.toFixed(2)}
                          </td>
                          <td className="py-3 text-amber-600 font-semibold">
                            -${ord.admin_commission.toFixed(2)}
                          </td>
                          <td className="py-3 font-black text-emerald-600">
                            +${ord.vendor_earning.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PRODUCTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "products" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Product Inventory
              </h2>
              <p className="text-xs text-slate-500">
                Manage your prices, stock, discounts, and visual media.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none w-48 sm:w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none text-slate-700 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="disabled">Disabled</option>
              </select>

              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Loading inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                No products found
              </p>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Old / Discount</th>
                    <th className="pb-3">Stock Qty</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <ImageWithFallback
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="max-w-[240px]">
                          <h4 className="font-bold text-slate-800 truncate" title={p.title}>
                            {p.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            PID: {p.pid || p.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ${parseFloat(p.price).toFixed(2)}
                      </td>
                      <td className="py-3 text-slate-400 line-through">
                        {p.old_price && parseFloat(p.old_price) > 0
                          ? `$${parseFloat(p.old_price).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            p.stock_qty > 5
                              ? "bg-slate-100 text-slate-700"
                              : p.stock_qty > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.stock_qty} in stock
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "draft"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.pid || p.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ORDERS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Customer Sales & Order Items
              </h2>
              <p className="text-xs text-slate-500">
                Items sold from your store with exact 0.1% platform commission breakdown.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order or buyer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none w-56 sm:w-64"
              />
            </div>
          </div>

          {loadingOrders ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No orders found</p>
              <p className="text-xs text-slate-400">
                Orders placed for your store will show item-level earnings here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Product Sold</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Item Subtotal</th>
                    <th className="pb-3 text-amber-600">0.1% Platform Fee</th>
                    <th className="pb-3 text-emerald-600 font-extrabold">
                      Your Net Earning
                    </th>
                    <th className="pb-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        #{ord.order_oid}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-slate-800">
                          {ord.buyer_name}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">
                          {ord.buyer_email}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 truncate max-w-[160px]">
                        {ord.product_title}
                      </td>
                      <td className="py-3">{ord.quantity}</td>
                      <td className="py-3 font-bold text-slate-900">
                        ${ord.sub_total.toFixed(2)}
                      </td>
                      <td className="py-3 text-amber-600 font-bold">
                        -${ord.admin_commission.toFixed(2)}
                      </td>
                      <td className="py-3 text-emerald-600 font-black text-sm">
                        +${ord.vendor_earning.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: WALLET & PAYOUTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "wallet" && (
        <div className="space-y-8">
          {/* Wallet Balance Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Seller Escrow Wallet
              </span>
              <h2 className="text-3xl sm:text-4xl font-black">
                ${stats.available_balance.toFixed(2)}
              </h2>
              <p className="text-xs text-slate-300">
                Available to withdraw now (Net sales earnings minus past withdrawals).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Paid Out
                </span>
                <span className="text-lg font-black text-emerald-400">
                  ${stats.total_paid_out.toFixed(2)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Pending Approval
                </span>
                <span className="text-lg font-black text-amber-400">
                  ${stats.pending_payout.toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Request Withdrawal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Payout History (Col 7) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Withdrawal History
              </h3>

              {loadingPayouts ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading payouts...
                </div>
              ) : payouts.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No withdrawal requests recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Method</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Transaction Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {payouts.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50/80">
                          <td className="py-3 text-slate-500">
                            {pay.created_at_formatted || "Recently"}
                          </td>
                          <td className="py-3 font-black text-slate-900 text-sm">
                            ${parseFloat(pay.amount).toFixed(2)}
                          </td>
                          <td className="py-3 text-slate-700">{pay.payout_method}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                pay.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : pay.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : pay.status === "processing"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[10px] text-slate-500">
                            {pay.transaction_id || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bank & Payment Information Settings (Col 5) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Payout Destination
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bank or mobile account where marketplace admin transfers your
                  earnings.
                </p>
              </div>

              <form onSubmit={handleSaveBankSettings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank / BRAC Bank / Chase"
                    value={bankForm.bank_name}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bank_name: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234567890"
                      value={bankForm.account_number}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          account_number: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Routing #
                    </label>
                    <input
                      type="text"
                      placeholder="Routing Code"
                      value={bankForm.routing_number}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          routing_number: e.target.value,
                        })
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full Name as on Bank Account"
                    value={bankForm.account_name}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, account_name: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
                    Mobile Banking (Alternative)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={bankForm.mobile_banking_provider}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          mobile_banking_provider: e.target.value,
                        })
                      }
                      className="p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none text-slate-700"
                    >
                      <option value="bKash">bKash Merchant</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                    </select>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={bankForm.mobile_banking_number}
                      onChange={(e) =>
                        setBankForm({
                          ...bankForm,
                          mobile_banking_number: e.target.value,
                        })
                      }
                      className="p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {savingBank ? "Saving..." : "Save Payout Destination"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: REQUEST PAYOUT */}
      {/* ------------------------------------------------------------- */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Payout Request
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                Withdraw Your Net Earnings
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Available to withdraw:{" "}
                <strong className="text-emerald-700 font-bold">
                  ${stats.available_balance.toFixed(2)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Withdrawal Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={stats.available_balance}
                  required
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-base font-bold focus:ring-2 focus:ring-emerald-300 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (BEFTN / Wire)</option>
                  <option value="Mobile Banking">Mobile Banking (bKash / Nagad)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
                <span className="font-bold text-slate-800 block">
                  Target Account:
                </span>
                {payoutMethod === "Bank Transfer" ? (
                  <p>
                    {bankForm.bank_name || "No Bank Configured"} •{" "}
                    {bankForm.account_number} ({bankForm.account_name})
                  </p>
                ) : (
                  <p>
                    {bankForm.mobile_banking_provider}:{" "}
                    {bankForm.mobile_banking_number || "No Mobile Number Configured"}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout || stats.available_balance <= 0}
                  className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {submittingPayout ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT PRODUCT (WITH MULTI-GALLERY, COLORS, SIZES, SPECIFICATIONS) */}
      {/* ------------------------------------------------------------- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 text-white text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />{" "}
                  {editingProductId ? "Edit Store Product" : "Add New Store Product"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Fill in primary details, upload multiple gallery images, configure colors, sizes, and technical specifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> 1. Basic Product Information
                </h4>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultra Titanium Smart Watch Series 9"
                    value={productForm.title}
                    onChange={(e) =>
                      setProductForm({ ...productForm, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Category *</label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) =>
                        setProductForm({ ...productForm, category_id: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Sale Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="99.99"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Old Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="149.99"
                      value={productForm.old_price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, old_price: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Shipping Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={productForm.shipping_amount}
                      onChange={(e) =>
                        setProductForm({ ...productForm, shipping_amount: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.stock_qty}
                      onChange={(e) =>
                        setProductForm({ ...productForm, stock_qty: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) =>
                        setProductForm({ ...productForm, status: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={(e) =>
                          setProductForm({ ...productForm, featured: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                      />
                      <span className="text-slate-300 font-bold">Featured Product</span>
                    </label>
                  </div>
                </div>

                {/* Primary Cover Image File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-400" /> Primary Cover Image *
                    </label>
                    {uploadingMainImage && (
                      <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                      </span>
                    )}
                  </div>

                  {productForm.image ? (
                    <div className="flex items-center gap-3.5 p-3 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-inner">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                        <img
                          src={productForm.image}
                          alt="Product Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Image uploaded successfully
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {productForm.image}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-indigo-500/30">
                            <Upload className="w-3 h-3" /> Change File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingMainImage}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadSingleImage(
                                    e.target.files[0],
                                    (url) => setProductForm({ ...productForm, image: url }),
                                    setUploadingMainImage,
                                    "products"
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, image: "" })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/50 hover:bg-slate-800/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingMainImage}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadSingleImage(
                              e.target.files[0],
                              (url) => setProductForm({ ...productForm, image: url }),
                              setUploadingMainImage,
                              "products"
                            );
                          }
                        }}
                      />
                      {uploadingMainImage ? (
                        <div className="flex flex-col items-center py-2 text-indigo-400">
                          <RefreshCw className="w-7 h-7 animate-spin mb-1.5" />
                          <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-1">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1.5 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            Click to browse or drop cover image file
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            PNG, JPG, WEBP, JPEG up to 12MB
                          </p>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Comprehensive description of product features..."
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION 2: MULTIPLE GALLERY IMAGES */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> 2. Multiple Gallery Images ({productForm.gallery?.filter(Boolean).length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Upload multiple product photos from your device
                    </p>
                  </div>
                  <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all">
                    {uploadingGallery ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload Photos
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={(e) => handleUploadGalleryFiles(e.target.files)}
                    />
                  </label>
                </div>

                {/* Gallery Preview Grid */}
                {productForm.gallery?.filter(Boolean).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {productForm.gallery.filter(Boolean).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 aspect-square shadow-sm"
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryItem(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl aspect-square flex flex-col items-center justify-center text-center transition-all group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingGallery}
                        onChange={(e) => handleUploadGalleryFiles(e.target.files)}
                      />
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                      <span className="text-[10px] text-slate-400 group-hover:text-sky-300 font-medium mt-1">
                        Add More
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={(e) => handleUploadGalleryFiles(e.target.files)}
                    />
                    {uploadingGallery ? (
                      <div className="flex flex-col items-center py-2 text-sky-400">
                        <RefreshCw className="w-6 h-6 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold">Uploading photos to Cloudinary...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-sky-400/80 group-hover:text-sky-400 mb-1.5 transition-colors" />
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                          Select multiple gallery photos from your device
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Hold Ctrl / Shift to select multiple images at once
                        </span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              {/* SECTION 3: MULTIPLE COLORS */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> 3. Color Variations ({productForm.colors.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddColorItem}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-pink-500/30 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {productForm.colors.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Midnight Black)"
                        value={c.name}
                        onChange={(e) => handleColorChange(idx, "name", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs"
                      />
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                        <input
                          type="color"
                          value={c.color_code || "#000000"}
                          onChange={(e) => handleColorChange(idx, "color_code", e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{c.color_code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: MULTIPLE SIZES */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 4. Size / Storage Options ({productForm.sizes.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSizeItem}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-amber-500/30 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Size
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {productForm.sizes.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Size / Dimension (e.g. Small, Medium, 256GB, 512GB)"
                        value={s.name}
                        onChange={(e) => handleSizeChange(idx, "name", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Additional Price ($)"
                        value={s.price || ""}
                        onChange={(e) => handleSizeChange(idx, "price", e.target.value)}
                        className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: TECHNICAL SPECIFICATIONS */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> 5. Technical Specifications ({productForm.specifications.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpecItem}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500/30 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Specification
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {productForm.specifications.map((sp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Title / Key (e.g. Battery Life)"
                        value={sp.title}
                        onChange={(e) => handleSpecChange(idx, "title", e.target.value)}
                        className="w-1/3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Content / Value (e.g. Up to 36 hours continuous)"
                        value={sp.content}
                        onChange={(e) => handleSpecChange(idx, "content", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : editingProductId ? (
                    "Update Product with All Variations"
                  ) : (
                    "Publish Product with All Variations"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
