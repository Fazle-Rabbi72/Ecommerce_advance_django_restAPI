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
  Printer,
  BarChart3,
  Tag,
  Percent,
  Ticket,
  Copy,
  Check,
} from "lucide-react";

const VendorDashboard = () => {
  const _userData = UserData();
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, orders, wallet
  const [salesRange, setSalesRange] = useState("30d"); // 7d, 30d, 90d

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

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [_couponStats, setCouponStats] = useState({ total_coupons: 0, active_coupons: 0 });
  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState("all"); // all, active, inactive
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({ id: null, code: "", discount: 10, active: true });
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [showDeleteCouponModal, setShowDeleteCouponModal] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [copiedCouponId, setCopiedCouponId] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all vendor data once authenticated
  const fetchVendorData = (vendorId) => {
    if (!vendorId) return;
    fetchStats(vendorId);
    fetchProducts(vendorId);
    fetchOrders(vendorId);
    fetchPayouts(vendorId);
    fetchCoupons(vendorId);
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

  const fetchCoupons = async (vendorId) => {
    if (!vendorId) return;
    setLoadingCoupons(true);
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        apiInstance.get(`vendor-coupon-list/${vendorId}/`),
        apiInstance.get(`vendor-coupon-stats/${vendorId}/`),
      ]);
      if (listRes.status === "fulfilled") {
        setCoupons(Array.isArray(listRes.value.data) ? listRes.value.data : []);
      }
      if (
        statsRes.status === "fulfilled" &&
        Array.isArray(statsRes.value.data) &&
        statsRes.value.data[0]
      ) {
        setCouponStats(statsRes.value.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleOpenCreateCoupon = () => {
    setCouponForm({ id: null, code: "", discount: 10, active: true });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coupon) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      active: Boolean(coupon.active),
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const vendorId = vendorData?.id || vendorData?.vendor_id;
    if (!vendorId) return;

    const trimmedCode = String(couponForm.code || "").trim().toUpperCase();
    if (!trimmedCode) {
      showToast.warning("Please enter a coupon code");
      return;
    }
    const discountNum = parseInt(couponForm.discount, 10);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      showToast.warning("Discount percentage must be between 1% and 100%");
      return;
    }

    setSubmittingCoupon(true);
    try {
      if (couponForm.id) {
        const res = await apiInstance.put(
          `vendor-coupon-detail/${vendorId}/${couponForm.id}/`,
          {
            code: trimmedCode,
            discount: discountNum,
            active: Boolean(couponForm.active),
          }
        );
        showToast.success(res.data?.message || "Coupon updated successfully!");
      } else {
        const res = await apiInstance.post(
          `vendor-coupon-list/${vendorId}/`,
          {
            vendor_id: vendorId,
            code: trimmedCode,
            discount: discountNum,
            active: Boolean(couponForm.active),
          }
        );
        showToast.success(res.data?.message || "Coupon created successfully!");
      }
      setShowCouponModal(false);
      setCouponForm({ id: null, code: "", discount: 10, active: true });
      fetchCoupons(vendorId);
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
        "Could not save coupon. Please verify the code is unique."
      );
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    const vendorId = vendorData?.id || vendorData?.vendor_id;
    if (!vendorId) return;

    try {
      const res = await apiInstance.post(
        `vendor-coupon-toggle/${vendorId}/${coupon.id}/`
      );
      showToast.success(res.data?.message || "Coupon status updated");
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, active: res.data?.active ?? !c.active } : c
        )
      );
      fetchCoupons(vendorId);
    } catch (_err) {
      showToast.error("Failed to update coupon status");
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    const vendorId = vendorData?.id || vendorData?.vendor_id;
    if (!vendorId) return;

    try {
      const res = await apiInstance.delete(
        `vendor-coupon-detail/${vendorId}/${couponId}/`
      );
      showToast.success(res.data?.message || "Coupon deleted successfully");
      setShowDeleteCouponModal(false);
      setCouponToDelete(null);
      fetchCoupons(vendorId);
    } catch (_err) {
      showToast.error("Failed to delete coupon");
    }
  };

  const copyCouponCode = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedCouponId(id);
    showToast.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => {
      setCopiedCouponId((prev) => (prev === id ? null : prev));
    }, 2000);
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
    } catch (_err) {
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
  const _handleGalleryChange = (index, value) => {
    const updated = [...(productForm.gallery || [])];
    updated[index] = value;
    setProductForm({ ...productForm, gallery: updated });
  };

  const _handleAddGalleryItem = () => {
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
    } catch (_err) {
      showToast.error("Could not delete product.");
    }
  };

  // Print Packing Slip
  const handlePrintPackingSlip = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Packing Slip - #${order.order_oid}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 12px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
            .table th { background: #f8fafc; font-weight: 700; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">Official AxuraShop Packing Slip</span>
            <h1 style="margin: 8px 0 4px 0; font-size: 24px;">Order #${order.order_oid}</h1>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Date: ${new Date().toLocaleDateString()} | Vendor: ${stats.vendor_name || 'Axura Seller'}</p>
          </div>
          <div style="margin-bottom: 20px; font-size: 13px;">
            <strong>Customer:</strong> ${order.buyer_name || 'Customer'}<br/>
            <strong>Email:</strong> ${order.buyer_email || 'N/A'}<br/>
            <strong>Payment:</strong> <span style="color: #059669; font-weight: bold;">${order.payment_status || 'Paid'}</span>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${order.product_title || 'Item'}</td>
                <td>${order.quantity || 1}</td>
                <td>$${Number(order.sub_total || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Thank you for shopping on AxuraShop. Handled and packed with verified authenticity.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "coupons"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Coupons & Discounts ({coupons.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* 1. WHAT NEEDS ACTION TODAY (First thing seller sees!) */}
          {(() => {
            const ordersToFulfill = orders.filter(
              (o) =>
                (o.order_status || "").toLowerCase().includes("pending") ||
                (o.order_status || "").toLowerCase().includes("processing")
            );
            const lowStockItems = products.filter(
              (p) => Number(p.stock_qty || 0) <= 5
            );

            return (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-900/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <Clock className="w-3.5 h-3.5" /> Action Needed Today
                    </span>
                    <h2 className="text-xl font-black text-white">Daily Operations Priority</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("wallet");
                      setShowPayoutModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md min-h-[44px] transition-all cursor-pointer w-fit"
                  >
                    <CreditCard className="w-4 h-4" /> Request Payout (${stats.available_balance.toFixed(2)})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer flex items-center justify-between min-h-[48px]"
                  >
                    <div>
                      <p className="text-xs text-slate-300">Orders to Fulfill</p>
                      <h4 className="text-xl font-black text-white">{ordersToFulfill.length} order(s)</h4>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
                      Pending Dispatch
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("products")}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer flex items-center justify-between min-h-[48px]"
                  >
                    <div>
                      <p className="text-xs text-slate-300">Low Stock Alert</p>
                      <h4 className="text-xl font-black text-white">{lowStockItems.length} SKU(s)</h4>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold">
                      &le; 5 units left
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("wallet")}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer flex items-center justify-between min-h-[48px]"
                  >
                    <div>
                      <p className="text-xs text-slate-300">Withdrawable Balance</p>
                      <h4 className="text-xl font-black text-emerald-400">${stats.available_balance.toFixed(2)}</h4>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      Ready to Payout
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. ONBOARDING CHECKLIST FOR NEW VENDORS */}
          {(() => {
            const hasProducts = products.length > 0;
            const hasPayoutInfo = Boolean(
              bankForm.bank_name || stats.bank_name || bankForm.mobile_banking_number || stats.mobile_banking_number
            );
            const completedCount = 1 + (hasProducts ? 1 : 0) + (hasPayoutInfo ? 1 : 0);
            const progressPercent = Math.round((completedCount / 3) * 100);

            if (completedCount < 3) {
              return (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Store Launch Checklist
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Complete your setup to maximize buyer conversions
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                      {progressPercent}% Complete
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">1. Store Brand Configured</p>
                        <span className="text-[11px] text-emerald-700">Verified identity</span>
                      </div>
                    </div>

                    <div
                      onClick={handleOpenAddProduct}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        hasProducts
                          ? "bg-emerald-50/70 border-emerald-100"
                          : "bg-slate-50 hover:bg-indigo-50/50 border-slate-200"
                      }`}
                    >
                      {hasProducts ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-indigo-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800">2. Add First Product</p>
                        <span className="text-[11px] text-slate-500">
                          {hasProducts ? `${products.length} listed` : "Click to add catalog item"}
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab("wallet")}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        hasPayoutInfo
                          ? "bg-emerald-50/70 border-emerald-100"
                          : "bg-slate-50 hover:bg-indigo-50/50 border-slate-200"
                      }`}
                    >
                      {hasPayoutInfo ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800">3. Set Payout Account</p>
                        <span className="text-[11px] text-slate-500">
                          {hasPayoutInfo ? "Bank / Mobile connected" : "Add bank or bKash / Nagad"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 3. SALES CHART WITH 7d / 30d / 90d TOGGLE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Store Sales & Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual earnings trajectory across customer checkouts.
                </p>
              </div>

              {/* Time Range Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {["7d", "30d", "90d"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setSalesRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                      salesRange === range
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive SVG Trend Bars */}
            <div className="space-y-2">
              <div className="h-44 sm:h-52 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-100 overflow-x-auto scrollbar-none">
                {(salesRange === "7d" ? [35, 60, 45, 80, 65, 95, 75] : salesRange === "30d" ? [25, 40, 30, 65, 45, 70, 55, 85, 60, 90, 75, 100] : [20, 35, 50, 45, 60, 75, 65, 85, 70, 90, 80, 95]).map((val, idx) => (
                  <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-2 group relative">
                    <div
                      className="w-full max-w-[28px] rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400 transition-all shadow-sm"
                      style={{ height: `${val * 1.5}px` }}
                    />
                    <span className="text-[10px] text-slate-400 font-semibold group-hover:text-slate-700">
                      {idx + 1}
                    </span>
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold">
                      ${((val / 100) * (stats.net_earnings || 150)).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>Period Start</span>
                <span className="font-semibold text-slate-600">Net Revenue Volume</span>
                <span>Today</span>
              </div>
            </div>
          </div>

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
            <>
              <div className="hidden md:block overflow-x-auto">
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
                    <th className="pb-3 text-right">Actions</th>
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
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintPackingSlip(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer min-h-[36px]"
                          title="Print Packing Slip"
                        >
                          <Printer className="w-3.5 h-3.5" /> Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Orders Cards (<768px) */}
            <div className="md:hidden divide-y divide-slate-100 pt-2">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">#{ord.order_oid}</span>
                    <span className="text-sm font-extrabold text-emerald-600">+${ord.vendor_earning.toFixed(2)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{ord.product_title}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Buyer: {ord.buyer_name} (Qty {ord.quantity})</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[9px]">
                      {ord.payment_status}
                    </span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintPackingSlip(ord)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold min-h-[44px]"
                    >
                      <Printer className="w-4 h-4" /> Print Packing Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
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
      {/* TAB 4: COUPONS & DISCOUNTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "coupons" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Promotional Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-800/40">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> Seller Promo Codes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                Coupons & Store Discounts
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Create custom discount promo codes for your products. When shoppers apply your coupon at checkout, the discount is deducted immediately on all items from your store.
              </p>
            </div>

            <button
              onClick={handleOpenCreateCoupon}
              className="px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Coupon</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Coupons
              </span>
              <p className="text-2xl font-black text-slate-900">{coupons.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Active Promo Codes
              </span>
              <p className="text-2xl font-black text-emerald-600">
                {coupons.filter((c) => c.active).length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Inactive Codes
              </span>
              <p className="text-2xl font-black text-slate-500">
                {coupons.filter((c) => !c.active).length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Total Redemptions
              </span>
              <p className="text-2xl font-black text-indigo-600">
                {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupon code..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filter:</span>
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setCouponFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    couponFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({coupons.length})
                </button>
                <button
                  onClick={() => setCouponFilter("active")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    couponFilter === "active"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Active ({coupons.filter((c) => c.active).length})
                </button>
                <button
                  onClick={() => setCouponFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    couponFilter === "inactive"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Inactive ({coupons.filter((c) => !c.active).length})
                </button>
              </div>
            </div>
          </div>

          {/* Coupons Table / Cards */}
          {loadingCoupons ? (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200/80">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading coupons...
            </div>
          ) : (() => {
            const filteredCoupons = coupons.filter((coupon) => {
              const matchesSearch =
                !couponSearch ||
                coupon.code.toLowerCase().includes(couponSearch.toLowerCase());
              const matchesStatus =
                couponFilter === "all"
                  ? true
                  : couponFilter === "active"
                  ? Boolean(coupon.active)
                  : !coupon.active;
              return matchesSearch && matchesStatus;
            });

            if (filteredCoupons.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      No coupons found
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {couponSearch || couponFilter !== "all"
                        ? "No coupons match your filter criteria."
                        : "You haven't created any promotional coupons yet. Create one to reward your buyers with instant discounts!"}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateCoupon}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Coupon</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-4 px-6">Coupon Code</th>
                        <th className="py-4 px-6">Discount Rate</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Redemptions</th>
                        <th className="py-4 px-6">Date Created</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredCoupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-slate-900 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg tracking-wider">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => copyCouponCode(coupon.code, coupon.id)}
                                title="Copy coupon code"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {copiedCouponId === coupon.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200/60">
                              <Percent className="w-3 h-3" />
                              {coupon.discount}% OFF
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleCoupon(coupon)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                                coupon.active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  coupon.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                }`}
                              />
                              {coupon.active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900">
                              {coupon.used_count || 0}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-1">uses</span>
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {coupon.date ? new Date(coupon.date).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditCoupon(coupon)}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                                title="Edit Coupon"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCouponToDelete(coupon);
                                  setShowDeleteCouponModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (<768px) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredCoupons.map((coupon) => (
                    <div key={coupon.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCouponCode(coupon.code, coupon.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            {copiedCouponId === coupon.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">
                          {coupon.discount}% OFF
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Used: <strong>{coupon.used_count || 0} times</strong></span>
                        <span>{coupon.date ? new Date(coupon.date).toLocaleDateString() : ""}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleCoupon(coupon)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer min-h-[44px] ${
                            coupon.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              coupon.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {coupon.active ? "Active" : "Inactive"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditCoupon(coupon)}
                            className="p-2.5 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCouponToDelete(coupon);
                              setShowDeleteCouponModal(true);
                            }}
                            className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT VENDOR COUPON */}
      {/* ------------------------------------------------------------- */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCouponModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" />
                {couponForm.id ? "Edit Coupon" : "New Discount Code"}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {couponForm.id ? "Update Store Coupon" : "Create Store Coupon"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set a promo code and discount percentage for your store's products.
              </p>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-5">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Coupon Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AXURA20, SALE15"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Letters and numbers only. Codes are automatically uppercase.
                </p>
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Discount Percentage *
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    {couponForm.discount}% OFF
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={couponForm.discount}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discount: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <div className="relative w-20">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={couponForm.discount}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discount: Math.min(100, Math.max(1, Number(e.target.value))),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Active Status
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {couponForm.active
                      ? "Shoppers can use this coupon at checkout right away."
                      : "Coupon is disabled and cannot be redeemed."}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.active}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        active: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md space-y-1 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-100">
                    Customer Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                    {couponForm.active ? "Ready to Use" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-lg font-black tracking-wider">
                    {couponForm.code || "SAMPLE20"}
                  </span>
                  <span className="text-xl font-black">
                    {couponForm.discount || 10}% OFF
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100/90 pt-0.5">
                  Applies to all products by {vendorData?.name || "your store"}
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingCoupon ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : couponForm.id ? (
                    "Save Changes"
                  ) : (
                    "Create Coupon"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {showDeleteCouponModal && couponToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Delete Coupon?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete coupon{" "}
                <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {couponToDelete.code}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteCouponModal(false);
                  setCouponToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCoupon(couponToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
