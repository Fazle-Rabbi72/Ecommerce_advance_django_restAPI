import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import { showToast } from "../../utils/toast";
import ImageWithFallback from "../components/ImageWithFallback";
import {
  LayoutDashboard,
  Store,
  Package,
  Truck,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ArrowUpRight,
  X,
  Palette,
  Layers,
  Image as ImageIcon,
  FileText,
  Sliders,
  Upload,
} from "lucide-react";

const AdminDashboard = () => {
  const userData = UserData();
  const [activeTab, setActiveTab] = useState("overview"); // overview, vendors, products, orders

  // Analytics State
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_products: 0,
    total_vendors: 0,
    pending_orders: 0,
    recent_orders: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Vendors State
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");

  // Products State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  // Seller Applications & Payouts State
  const [vendorRequests, setVendorRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [adminPayouts, setAdminPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Vendor & Category Form States
  const initialVendorForm = {
    name: "",
    email: "",
    mobile: "",
    description: "",
    image: "",
  };
  const [vendorForm, setVendorForm] = useState(initialVendorForm);
  const [submittingVendor, setSubmittingVendor] = useState(false);

  const initialCategoryForm = {
    title: "",
    image: "",
  };
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Initial Product Form State
  const initialProductForm = {
    title: "",
    category_id: "",
    vendor_id: "",
    price: "",
    old_price: "",
    shipping_amount: "",
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

  const [productForm, setProductForm] = useState(initialProductForm);

  // Image Uploading Loading States
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingEditMainImage, setUploadingEditMainImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingEditGallery, setUploadingEditGallery] = useState(false);
  const [uploadingVendorImage, setUploadingVendorImage] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingEditProduct, setSubmittingEditProduct] = useState(false);

  // Check superuser authority
  const isSuperUser = Boolean(userData?.is_superuser);

  // Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiInstance.get("admin/stats/");
      setStats(res.data || {});
    } catch (err) {
      console.warn("Could not load admin stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Vendors
  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await apiInstance.get("admin/vendors/");
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not load admin vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch Products & Categories
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiInstance.get("admin/products/"),
        apiInstance.get("category/"),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      console.warn("Could not load admin products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await apiInstance.get("admin/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not load admin orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Vendor Requests
  const fetchVendorRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await apiInstance.get("vendor/requests/");
      setVendorRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not load vendor requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Admin Payouts
  const fetchAdminPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const res = await apiInstance.get("admin/payouts/");
      setAdminPayouts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not load admin payouts:", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      await apiInstance.patch(`vendor/request/${reqId}/approve/`);
      showToast.success("Vendor approved and seller store activated!");
      fetchVendorRequests();
      fetchStats();
      fetchVendors();
    } catch (err) {
      showToast.error("Failed to approve request.");
    }
  };

  const handleRejectRequest = async (reqId) => {
    if (!window.confirm("Reject and remove this vendor request?")) return;
    try {
      await apiInstance.patch(`vendor/request/${reqId}/reject/`);
      showToast.info("Vendor request rejected.");
      fetchVendorRequests();
      fetchStats();
    } catch (err) {
      showToast.error("Failed to reject request.");
    }
  };

  const handleUpdatePayout = async (payoutId, newStatus) => {
    let txId = "";
    if (newStatus === "paid") {
      txId = window.prompt("Enter Bank Transfer / bKash Transaction ID / Reference (optional):") || "";
    }
    try {
      await apiInstance.patch(`admin/payouts/${payoutId}/status/`, {
        status: newStatus,
        transaction_id: txId,
      });
      showToast.success(`Payout marked as ${newStatus}!`);
      fetchAdminPayouts();
      fetchStats();
    } catch (err) {
      showToast.error("Failed to update payout status.");
    }
  };

  useEffect(() => {
    if (isSuperUser) {
      fetchStats();
      fetchCategories();
    }
  }, [isSuperUser]);

  const fetchCategories = async () => {
    try {
      const res = await apiInstance.get("category/");
      if (Array.isArray(res.data)) setCategories(res.data);
    } catch (err) {
      console.warn("Could not load categories:", err);
    }
  };

  useEffect(() => {
    if (!isSuperUser) return;
    if (activeTab === "overview") fetchStats();
    if (activeTab === "vendors") fetchVendors();
    if (activeTab === "requests") fetchVendorRequests();
    if (activeTab === "payouts") fetchAdminPayouts();
    if (activeTab === "products") {
      fetchProducts();
      fetchVendors();
    }
    if (activeTab === "orders") fetchOrders();
  }, [activeTab, isSuperUser]);

  // Toggle Vendor Status
  const handleToggleVendor = async (vendorId, currentStatus) => {
    try {
      const res = await apiInstance.post(`admin/vendors/${vendorId}/toggle/`);
      showToast.success(res.data?.message || "Vendor status updated");
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, active: res.data.active } : v))
      );
      fetchStats();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to update vendor");
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
      const res = await apiInstance.post("admin/upload-image/", formData);
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

  const handleUploadGalleryFiles = async (fileList, isEdit = false) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      showToast.warning("Please select valid image files");
      return;
    }

    const setLoading = isEdit ? setUploadingEditGallery : setUploadingGallery;
    setLoading(true);
    const formData = new FormData();
    validFiles.forEach((file) => formData.append("images", file));
    formData.append("folder", "products/gallery");

    try {
      const res = await apiInstance.post("admin/upload-image/", formData);
      const newUrls = res.data?.urls || (res.data?.url ? [res.data.url] : []);
      if (newUrls.length > 0) {
        if (isEdit) {
          const existing = (selectedProduct?.gallery || []).filter((g) => Boolean(g && g.trim()));
          setSelectedProduct((prev) => ({
            ...prev,
            gallery: [...existing, ...newUrls],
          }));
        } else {
          const existing = productForm.gallery.filter((g) => Boolean(g && g.trim()));
          setProductForm((prev) => ({
            ...prev,
            gallery: [...existing, ...newUrls],
          }));
        }
        showToast.success(`${newUrls.length} gallery image(s) uploaded!`);
      }
    } catch (err) {
      console.error("Gallery upload failed:", err);
      showToast.error(err.response?.data?.message || "Failed to upload gallery images");
    } finally {
      setLoading(false);
    }
  };

  // --- Dynamic Form Array Helpers (Gallery, Colors, Sizes, Specs) ---
  const handleGalleryChange = (index, value, isEdit = false) => {
    if (isEdit) {
      const updated = [...(selectedProduct.gallery || [])];
      updated[index] = value;
      setSelectedProduct({ ...selectedProduct, gallery: updated });
    } else {
      const updated = [...productForm.gallery];
      updated[index] = value;
      setProductForm({ ...productForm, gallery: updated });
    }
  };

  const handleAddGalleryItem = (isEdit = false) => {
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        gallery: [...(selectedProduct.gallery || []), ""],
      });
    } else {
      setProductForm({
        ...productForm,
        gallery: [...productForm.gallery, ""],
      });
    }
  };

  const handleRemoveGalleryItem = (index, isEdit = false) => {
    if (isEdit) {
      setSelectedProduct((prev) => ({
        ...prev,
        gallery: (prev?.gallery || []).filter((_, i) => i !== index),
      }));
    } else {
      setProductForm((prev) => ({
        ...prev,
        gallery: prev.gallery.filter((_, i) => i !== index),
      }));
    }
  };

  // Color Handlers
  const handleColorChange = (index, field, value, isEdit = false) => {
    if (isEdit) {
      const updated = [...(selectedProduct.colors || [])];
      updated[index] = { ...updated[index], [field]: value };
      setSelectedProduct({ ...selectedProduct, colors: updated });
    } else {
      const updated = [...productForm.colors];
      updated[index] = { ...updated[index], [field]: value };
      setProductForm({ ...productForm, colors: updated });
    }
  };

  const handleAddColorItem = (isEdit = false) => {
    const newItem = { name: "", color_code: "#4f46e5" };
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        colors: [...(selectedProduct.colors || []), newItem],
      });
    } else {
      setProductForm({
        ...productForm,
        colors: [...productForm.colors, newItem],
      });
    }
  };

  const handleRemoveColorItem = (index, isEdit = false) => {
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        colors: (selectedProduct.colors || []).filter((_, i) => i !== index),
      });
    } else {
      setProductForm({
        ...productForm,
        colors: productForm.colors.filter((_, i) => i !== index),
      });
    }
  };

  // Size Handlers
  const handleSizeChange = (index, field, value, isEdit = false) => {
    if (isEdit) {
      const updated = [...(selectedProduct.sizes || [])];
      updated[index] = { ...updated[index], [field]: value };
      setSelectedProduct({ ...selectedProduct, sizes: updated });
    } else {
      const updated = [...productForm.sizes];
      updated[index] = { ...updated[index], [field]: value };
      setProductForm({ ...productForm, sizes: updated });
    }
  };

  const handleAddSizeItem = (isEdit = false) => {
    const newItem = { name: "", price: "0.00" };
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        sizes: [...(selectedProduct.sizes || []), newItem],
      });
    } else {
      setProductForm({
        ...productForm,
        sizes: [...productForm.sizes, newItem],
      });
    }
  };

  const handleRemoveSizeItem = (index, isEdit = false) => {
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        sizes: (selectedProduct.sizes || []).filter((_, i) => i !== index),
      });
    } else {
      setProductForm({
        ...productForm,
        sizes: productForm.sizes.filter((_, i) => i !== index),
      });
    }
  };

  // Specification Handlers
  const handleSpecChange = (index, field, value, isEdit = false) => {
    if (isEdit) {
      const updated = [...(selectedProduct.specifications || [])];
      updated[index] = { ...updated[index], [field]: value };
      setSelectedProduct({ ...selectedProduct, specifications: updated });
    } else {
      const updated = [...productForm.specifications];
      updated[index] = { ...updated[index], [field]: value };
      setProductForm({ ...productForm, specifications: updated });
    }
  };

  const handleAddSpecItem = (isEdit = false) => {
    const newItem = { title: "", content: "" };
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        specifications: [...(selectedProduct.specifications || []), newItem],
      });
    } else {
      setProductForm({
        ...productForm,
        specifications: [...productForm.specifications, newItem],
      });
    }
  };

  const handleRemoveSpecItem = (index, isEdit = false) => {
    if (isEdit) {
      setSelectedProduct({
        ...selectedProduct,
        specifications: (selectedProduct.specifications || []).filter(
          (_, i) => i !== index
        ),
      });
    } else {
      setProductForm({
        ...productForm,
        specifications: productForm.specifications.filter((_, i) => i !== index),
      });
    }
  };

  // Handle Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      showToast.warning("Title and Price are required");
      return;
    }

    setSubmittingProduct(true);
    const payload = {
      ...productForm,
      gallery: productForm.gallery.filter((g) => Boolean(g && g.trim())),
      colors: productForm.colors.filter((c) => Boolean(c.name && c.name.trim())),
      sizes: productForm.sizes.filter((s) => Boolean(s.name && s.name.trim())),
      specifications: productForm.specifications.filter(
        (sp) => Boolean(sp.title && sp.title.trim())
      ),
    };

    try {
      await apiInstance.post("admin/products/", payload);
      showToast.success("Product created with images, colors, and specifications!");
      setShowAddProductModal(false);
      setProductForm(initialProductForm);
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error("Product creation failed:", err);
      showToast.error(err.response?.data?.message || "Failed to create product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Add Vendor Submit
  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      showToast.warning("Vendor / Store name is required");
      return;
    }
    setSubmittingVendor(true);
    try {
      const res = await apiInstance.post("admin/vendors/", vendorForm);
      showToast.success(`Vendor store "${vendorForm.name}" created successfully!`);
      setShowAddVendorModal(false);
      setVendorForm(initialVendorForm);
      fetchVendors();
      fetchStats();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to create vendor store");
    } finally {
      setSubmittingVendor(false);
    }
  };

  // Handle Add Category Submit
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      showToast.warning("Category title is required");
      return;
    }
    setSubmittingCategory(true);
    try {
      await apiInstance.post("admin/categories/", categoryForm);
      showToast.success(`Category "${categoryForm.title}" created successfully!`);
      setShowAddCategoryModal(false);
      setCategoryForm(initialCategoryForm);
      fetchCategories();
      fetchProducts();
      fetchStats();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Open Edit Product Modal with Normalized Data
  const handleOpenEditProduct = (p) => {
    fetchVendors();
    setSelectedProduct({
      ...p,
      category_id: p.category?.id || "",
      vendor_id: p.vendor?.id || "",
      gallery: (p.gallery || [])
        .map((g) => (typeof g === "string" ? g : g.image || ""))
        .filter((g) => Boolean(g && g.trim())),
      colors: (p.color || []).map((c) => ({
        name: c.name || "",
        color_code: c.color_code || "#000000",
      })),
      sizes: (p.size || []).map((s) => ({
        name: s.name || "",
        price: s.price || 0.0,
      })),
      specifications: (p.specification || []).map((sp) => ({
        title: sp.title || "",
        content: sp.content || "",
      })),
    });
    setShowEditProductModal(true);
  };

  // Handle Edit Product Submit
  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!selectedProduct.title || !selectedProduct.price) {
      showToast.warning("Title and Sale Price are required");
      return;
    }

    setSubmittingEditProduct(true);
    const payload = {
      ...selectedProduct,
      category_id: selectedProduct.category_id || selectedProduct.category?.id || null,
      vendor_id: selectedProduct.vendor_id || selectedProduct.vendor?.id || null,
      gallery: (selectedProduct.gallery || []).filter((g) => Boolean(g && (typeof g === "string" ? g.trim() : g))),
      colors: (selectedProduct.colors || []).filter(
        (c) => Boolean(c.name && c.name.trim())
      ),
      sizes: (selectedProduct.sizes || []).filter(
        (s) => Boolean(s.name && s.name.trim())
      ),
      specifications: (selectedProduct.specifications || []).filter(
        (sp) => Boolean(sp.title && sp.title.trim())
      ),
    };

    try {
      await apiInstance.put(`admin/products/${selectedProduct.id}/`, payload);
      showToast.success("Product updated with all variations!");
      setShowEditProductModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      console.error("Product update failed:", err);
      const errMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to update product";
      showToast.error(errMsg);
    } finally {
      setSubmittingEditProduct(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await apiInstance.delete(`admin/products/${productId}/`);
      showToast.success("Product deleted successfully");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      fetchStats();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Handle Order Status Update (Live Tracking Sync)
  const handleUpdateOrderStatus = async (orderOid, newStatus) => {
    setUpdatingOrderId(orderOid);
    try {
      const res = await apiInstance.patch(`admin/orders/${orderOid}/status/`, {
        order_status: newStatus,
      });
      showToast.success(res.data?.message || `Order #${orderOid} status: ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.oid === orderOid ? { ...o, order_status: newStatus } : o))
      );
      fetchStats();
    } catch (err) {
      console.error("Order status update failed:", err);
      const errMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to update order status";
      showToast.error(errMsg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Order Payment Status Update
  const handleUpdatePaymentStatus = async (orderOid, newPaymentStatus) => {
    setUpdatingOrderId(orderOid);
    try {
      const res = await apiInstance.patch(`admin/orders/${orderOid}/status/`, {
        payment_status: newPaymentStatus,
      });
      showToast.success(res.data?.message || `Order #${orderOid} payment marked as ${newPaymentStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.oid === orderOid ? { ...o, payment_status: newPaymentStatus } : o))
      );
      fetchStats();
    } catch (err) {
      console.error("Payment status update failed:", err);
      const errMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to update payment status";
      showToast.error(errMsg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // If user is not superuser, redirect to home
  if (!isSuperUser) {
    return <Navigate to="/" replace />;
  }

  // Filtered lists
  const filteredVendors = vendors.filter((v) =>
    (v.name || v.shop_name || v.user?.full_name || "")
      .toLowerCase()
      .includes(vendorSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    (p.title || p.category?.title || "")
      .toLowerCase()
      .includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) =>
    (o.oid || o.full_name || o.email || "")
      .toLowerCase()
      .includes(orderSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-12 2xl:px-16 max-w-screen-4k mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Superuser Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Enterprise Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Superuser authorized management: Multi-vendor controls, complete product variations (Gallery, Colors, Sizes, Specs), and real-time live shipping dispatch sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === "overview") fetchStats();
              if (activeTab === "vendors") fetchVendors();
              if (activeTab === "products") fetchProducts();
              if (activeTab === "orders") fetchOrders();
              showToast.info("Data refreshed");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 text-decoration-none"
          >
            <Store className="w-3.5 h-3.5" />
            View Storefront
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto py-6 border-b border-slate-800/80 no-scrollbar">
        {[
          { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
          { id: "vendors", label: "Vendors & Stores", icon: Store },
          {
            id: "requests",
            label: "Seller Applications",
            icon: Users,
            badge: stats.pending_vendor_requests,
          },
          {
            id: "payouts",
            label: "Vendor Payouts",
            icon: DollarSign,
            badge: stats.pending_payouts,
          },
          { id: "products", label: "Product Catalog", icon: Package },
          { id: "orders", label: "Orders & Logistics", icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="py-8 space-y-8 animate-in fade-in duration-200">
          {/* Key KPI Metric Cards (5 Columns including 0.1% Platform Profit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {/* 0.1% Marketplace Admin Commission (Highlight) */}
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-emerald-500/40 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-emerald-400/10 group-hover:text-emerald-400/20 transition-colors">
                <DollarSign className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  0.1% Platform Profit
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                  Admin Fee
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mb-2">
                ${Number(stats.admin_commission || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                Retained from vendor product sales
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-6 rounded-3xl border border-slate-700/60 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-indigo-400/10 group-hover:text-indigo-400/20 transition-colors">
                <DollarSign className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gross Platform GMV
                </span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                ${Number(stats.total_revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
                Total marketplace transaction volume
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-6 rounded-3xl border border-slate-700/60 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-sky-400/10 group-hover:text-sky-400/20 transition-colors">
                <ShoppingBag className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Orders
                </span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                {stats.total_orders || 0}
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-bold">{stats.pending_orders || 0}</span> orders awaiting delivery
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-6 rounded-3xl border border-slate-700/60 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-violet-400/10 group-hover:text-violet-400/20 transition-colors">
                <Package className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Products in Catalog
                </span>
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                {stats.total_products || 0}
              </div>
              <div className="text-xs text-slate-400">
                Active catalog synced with Cloudinary
              </div>
            </div>

            {/* Total Vendors */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 p-6 rounded-3xl border border-slate-700/60 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-pink-400/10 group-hover:text-pink-400/20 transition-colors">
                <Users className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Vendors
                </span>
                <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2">
                {stats.total_vendors || 0}
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-bold">{stats.pending_vendor_requests || 0}</span> new applications
              </div>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => {
                setActiveTab("products");
                setShowAddProductModal(true);
              }}
              className="cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create New Product</h3>
                  <p className="text-xs text-slate-400">Add with gallery, colors, sizes & specs</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </div>

            <div
              onClick={() => setActiveTab("orders")}
              className="cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Dispatch & Track Orders</h3>
                  <p className="text-xs text-slate-400">Update status to sync customer stepper</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </div>

            <div
              onClick={() => setActiveTab("vendors")}
              className="cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Vendors</h3>
                  <p className="text-xs text-slate-400">Activate or deactivate store vendors</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Customer Orders</h2>
                <p className="text-xs text-slate-400">Latest checkout events from NeonDB</p>
              </div>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All Orders <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {stats.recent_orders && stats.recent_orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stats.recent_orders.map((order) => (
                      <tr key={order.oid} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                          #{order.oid}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{order.full_name || "Guest Customer"}</div>
                          <div className="text-[10px] text-slate-400">{order.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {order.date ? new Date(order.date).toLocaleDateString() : "Recent"}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          ${order.total}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              order.payment_status === "paid"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              order.order_status === "Delivered"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : order.order_status === "Shipped" || order.order_status === "Out for Delivery"
                                ? "bg-sky-500/10 text-sky-400"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No orders placed yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR MANAGEMENT */}
      {activeTab === "vendors" && (
        <div className="py-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Registered Vendors</h2>
              <p className="text-xs text-slate-400">
                Manage vendor accounts, stores, and active activation states.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setVendorForm(initialVendorForm);
                  setShowAddVendorModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Vendor
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 overflow-hidden">
            {loadingVendors ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading vendors...
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No vendors found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Store / Vendor</th>
                      <th className="py-3.5 px-4">Owner</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
                              {vendor.image ? (
                                <img
                                  src={vendor.image}
                                  alt={vendor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Store className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {vendor.name || vendor.shop_name || "Vendor Store"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Slug: /{vendor.slug || "vendor"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {vendor.user?.full_name || vendor.user?.username || "Owner"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {vendor.email || vendor.user?.email || "No email"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {vendor.mobile || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {vendor.date ? new Date(vendor.date).toLocaleDateString() : "Verified"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1.5 ${
                              vendor.active
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {vendor.active ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleVendor(vendor.id, vendor.active)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              vendor.active
                                ? "bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30"
                                : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30"
                            }`}
                          >
                            {vendor.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SELLER APPLICATIONS */}
      {activeTab === "requests" && (
        <div className="py-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Seller Registration Requests</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {vendorRequests.filter((r) => r.status === "pending").length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Review onboarding applications. Approving a request instantly grants seller privileges and provisions their store.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchVendorRequests}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 overflow-hidden">
            {loadingRequests ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading seller requests...
              </div>
            ) : vendorRequests.length === 0 ? (
              <div className="py-20 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Pending Applications</h3>
                <p className="text-xs text-slate-500 mt-1">All seller requests have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Store / Business</th>
                      <th className="py-3.5 px-4">Applicant</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Applied Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {vendorRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold overflow-hidden">
                              {req.image ? (
                                <img src={req.image} alt={req.name} className="w-full h-full object-cover" />
                              ) : (
                                <Store className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {req.name || "Vendor Application"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ID: #{req.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {req.user?.full_name || req.user?.username || req.user?.email || "User"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {req.user?.email || "No email"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-mono text-[11px]">{req.mobile || "N/A"}</div>
                          <div className="text-slate-400 text-[10px]">{req.email || ""}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-xs">
                          {req.description || "No description provided."}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {req.date ? new Date(req.date).toLocaleDateString() : "Recent"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            req.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : req.status === "rejected"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {req.status || "pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                            {req.status !== "rejected" && (
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req.id)}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: VENDOR PAYOUTS & DISBURSEMENTS */}
      {activeTab === "payouts" && (
        <div className="py-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Vendor Payouts & Disbursements</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  0.1% Platform Fee Model
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Disburse vendor balances via bank wire or mobile banking (bKash/Nagad). Admin retains 0.1% platform fee automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAdminPayouts}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Payouts
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 overflow-hidden">
            {loadingPayouts ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading payout records...
              </div>
            ) : adminPayouts.length === 0 ? (
              <div className="py-20 text-center">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Withdrawal Requests</h3>
                <p className="text-xs text-slate-500 mt-1">Vendors have not submitted any payout requests yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Payout ID</th>
                      <th className="py-3.5 px-4">Vendor / Store</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Method & Account</th>
                      <th className="py-3.5 px-4">Transaction Ref</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {adminPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          #{p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">
                            {p.vendor_name || `Vendor #${p.vendor}`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Vendor ID: {p.vendor}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-sm">
                          ${Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="capitalize font-semibold text-slate-200">
                            {p.payout_method || "Bank Wire"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.account_details || "No details provided"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          {p.transaction_id || <span className="text-slate-500 italic">None</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : p.status === "rejected"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {p.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                            {p.status === "pending" && <Clock className="w-3 h-3" />}
                            {p.status === "rejected" && <XCircle className="w-3 h-3" />}
                            {p.status || "pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdatePayout(p.id, "paid")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdatePayout(p.id, "rejected")}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT MANAGEMENT (CRUD) */}
      {activeTab === "products" && (
        <div className="py-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Product Catalog Management</h2>
              <p className="text-xs text-slate-400">
                Create & update products with multiple images, color swatches, sizes, and detailed specifications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryForm(initialCategoryForm);
                  setShowAddCategoryModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Category
              </button>
              <button
                type="button"
                onClick={() => {
                  fetchVendors();
                  setProductForm(initialProductForm);
                  setShowAddProductModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 overflow-hidden">
            {loadingProducts ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading product catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Item Details</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Vendor / Store</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Variations</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                              <ImageWithFallback
                                src={p.image}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="max-w-xs">
                              <div className="font-bold text-white text-xs truncate">
                                {p.title}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                PID: {p.pid || p.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">
                            {p.category?.title || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <Store className="w-2.5 h-2.5 text-amber-400" />
                            {p.vendor?.name || p.vendor?.shop_name || "Official Store"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          ${p.price}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span
                            className={
                              p.stock_qty < 5
                                ? "text-rose-400 font-bold"
                                : "text-emerald-400"
                            }
                          >
                            {p.stock_qty || 0} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span title="Gallery Images" className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              🖼️ {p.gallery?.length || 0}
                            </span>
                            <span title="Colors" className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              🎨 {p.color?.length || 0}
                            </span>
                            <span title="Sizes" className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              📏 {p.size?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === "published"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {p.status || "published"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                              title="Edit Product, Images & Variations"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ORDER TRACKING & FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="py-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Live Order Dispatch & Tracking Control
              </h2>
              <p className="text-xs text-slate-400">
                Update shipping status in real-time. Changes immediately reflect on customer's live tracking stepper!
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search orders by OID, customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-3xl border border-slate-700/60 overflow-hidden">
            {loadingOrders ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No orders found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Order ID & Date</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Items / Total</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Live Dispatch Stepper Stage</th>
                      <th className="py-3.5 px-4 text-right">Advance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredOrders.map((order) => (
                      <tr key={order.oid} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-indigo-400 text-sm">
                            #{order.oid}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {order.date ? new Date(order.date).toLocaleString() : "Recent"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {order.full_name || "Customer"}
                          </div>
                          <div className="text-[10px] text-slate-400">{order.email}</div>
                          <div className="text-[10px] text-slate-400">{order.country || "USA"}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">${order.total}</div>
                          <div className="text-[10px] text-slate-400">
                            {order.orderitem?.length || 1} items
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={order.payment_status}
                            onChange={(e) =>
                              handleUpdatePaymentStatus(order.oid, e.target.value)
                            }
                            className={`bg-slate-900 border rounded-lg px-2.5 py-1 text-xs font-bold uppercase focus:outline-none ${
                              order.payment_status === "paid"
                                ? "text-emerald-400 border-emerald-500/30"
                                : "text-amber-400 border-amber-500/30"
                            }`}
                          >
                            <option value="paid">PAID</option>
                            <option value="pending">PENDING</option>
                            <option value="processing">PROCESSING</option>
                            <option value="failed">FAILED</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                order.order_status === "Delivered"
                                  ? "bg-emerald-400"
                                  : order.order_status === "Out for Delivery"
                                  ? "bg-sky-400 animate-ping"
                                  : order.order_status === "Shipped"
                                  ? "bg-indigo-400"
                                  : "bg-amber-400"
                              }`}
                            />
                            <span className="font-semibold text-white">
                              {order.order_status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {updatingOrderId === order.oid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold px-2 py-1 bg-indigo-500/10 rounded-lg">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                              </span>
                            ) : (
                              <select
                                value={order.order_status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(order.oid, e.target.value)
                                }
                                className="bg-indigo-950 border border-indigo-700/60 text-indigo-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="Pending">1. Pending (Placed)</option>
                                <option value="Processing">2. Processing (Packed)</option>
                                <option value="Shipped">3. Shipped (In Transit)</option>
                                <option value="Out for Delivery">4. Out for Delivery</option>
                                <option value="Delivered">5. Delivered</option>
                                <option value="Cancelled">6. Cancelled</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT (WITH MULTI-GALLERY, COLORS, SIZES, SPECIFICATIONS) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" /> Add New Store Product
                </h3>
                <p className="text-[11px] text-slate-400">
                  Fill in primary details, upload multiple gallery images, configure colors, sizes, and technical specifications.
                </p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-6 text-xs">
              {/* Basic Information */}
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
                    <label className="block text-slate-300 font-bold mb-1">Assigned Vendor *</label>
                    <select
                      value={productForm.vendor_id}
                      onChange={(e) =>
                        setProductForm({ ...productForm, vendor_id: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Vendor Store</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || v.shop_name || `Store #${v.id}`} ({v.user?.email || "Vendor"})
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
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
                    rows="2"
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
                      onChange={(e) => handleUploadGalleryFiles(e.target.files, false)}
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
                          onClick={() => handleRemoveGalleryItem(idx, false)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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
                        onChange={(e) => handleUploadGalleryFiles(e.target.files, false)}
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
                      onChange={(e) => handleUploadGalleryFiles(e.target.files, false)}
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
                    onClick={() => handleAddColorItem(false)}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-pink-500/30"
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
                        onChange={(e) => handleColorChange(idx, "name", e.target.value, false)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs"
                      />
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                        <input
                          type="color"
                          value={c.color_code || "#000000"}
                          onChange={(e) => handleColorChange(idx, "color_code", e.target.value, false)}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{c.color_code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorItem(idx, false)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
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
                    onClick={() => handleAddSizeItem(false)}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-amber-500/30"
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
                        onChange={(e) => handleSizeChange(idx, "name", e.target.value, false)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Additional Price ($)"
                        value={s.price || ""}
                        onChange={(e) => handleSizeChange(idx, "price", e.target.value, false)}
                        className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeItem(idx, false)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
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
                    onClick={() => handleAddSpecItem(false)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500/30"
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
                        onChange={(e) => handleSpecChange(idx, "title", e.target.value, false)}
                        className="w-1/3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Content / Value (e.g. Up to 36 hours continuous)"
                        value={sp.content}
                        onChange={(e) => handleSpecChange(idx, "content", e.target.value, false)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecItem(idx, false)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
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
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Product with All Variations"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT (WITH MULTI-GALLERY, COLORS, SIZES, SPECIFICATIONS) */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Product: {selectedProduct.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update title, pricing, gallery photos, colors, size variations, and specifications.
                </p>
              </div>
              <button
                onClick={() => setShowEditProductModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-6 text-xs">
              {/* Basic Fields */}
              <div className="space-y-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> 1. Core Product Details
                </h4>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={selectedProduct.title || ""}
                    onChange={(e) =>
                      setSelectedProduct({ ...selectedProduct, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Category</label>
                    <select
                      value={selectedProduct.category_id || ""}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, category_id: e.target.value })
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
                    <label className="block text-slate-300 font-bold mb-1">Assigned Vendor</label>
                    <select
                      value={selectedProduct.vendor_id || ""}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, vendor_id: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Vendor Store</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || v.shop_name || `Store #${v.id}`} ({v.user?.email || "Vendor"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Sale Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={selectedProduct.price || ""}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, price: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Old Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedProduct.old_price || ""}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, old_price: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct.stock_qty || 0}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          stock_qty: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Status</label>
                    <select
                      value={selectedProduct.status || "published"}
                      onChange={(e) =>
                        setSelectedProduct({ ...selectedProduct, status: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Primary Cover Image File Upload (Edit) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-400" /> Primary Cover Image
                    </label>
                    {uploadingEditMainImage && (
                      <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                      </span>
                    )}
                  </div>

                  {selectedProduct.image ? (
                    <div className="flex items-center gap-3.5 p-3 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-inner">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                        <img
                          src={selectedProduct.image}
                          alt="Product Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Image active
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {selectedProduct.image}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-indigo-500/30">
                            <Upload className="w-3 h-3" /> Change File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingEditMainImage}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadSingleImage(
                                    e.target.files[0],
                                    (url) =>
                                      setSelectedProduct({
                                        ...selectedProduct,
                                        image: url,
                                      }),
                                    setUploadingEditMainImage,
                                    "products"
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProduct({
                                ...selectedProduct,
                                image: "",
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
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
                        disabled={uploadingEditMainImage}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadSingleImage(
                              e.target.files[0],
                              (url) =>
                                setSelectedProduct({
                                  ...selectedProduct,
                                  image: url,
                                }),
                              setUploadingEditMainImage,
                              "products"
                            );
                          }
                        }}
                      />
                      {uploadingEditMainImage ? (
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
                            Click to browse or drop new cover image
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
                    rows="2"
                    value={selectedProduct.description || ""}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Edit Gallery Images */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-750">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> 2. Multiple Gallery Images ({selectedProduct.gallery?.filter(Boolean).length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Upload multiple product photos from your device
                    </p>
                  </div>
                  <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all">
                    {uploadingEditGallery ? (
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
                      disabled={uploadingEditGallery}
                      onChange={(e) => handleUploadGalleryFiles(e.target.files, true)}
                    />
                  </label>
                </div>

                {/* Gallery Preview Grid */}
                {selectedProduct.gallery?.filter(Boolean).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {selectedProduct.gallery.filter(Boolean).map((imgUrl, idx) => (
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
                          onClick={() => handleRemoveGalleryItem(idx, true)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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
                        disabled={uploadingEditGallery}
                        onChange={(e) => handleUploadGalleryFiles(e.target.files, true)}
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
                      disabled={uploadingEditGallery}
                      onChange={(e) => handleUploadGalleryFiles(e.target.files, true)}
                    />
                    {uploadingEditGallery ? (
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

              {/* Edit Colors */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-755">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> 3. Color Variations ({selectedProduct.colors?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddColorItem(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-pink-500/30"
                  >
                    <Plus className="w-3 h-3" /> Add Color
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedProduct.colors || []).map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Color Name"
                        value={c.name}
                        onChange={(e) => handleColorChange(idx, "name", e.target.value, true)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs"
                      />
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                        <input
                          type="color"
                          value={c.color_code || "#000000"}
                          onChange={(e) => handleColorChange(idx, "color_code", e.target.value, true)}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{c.color_code}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorItem(idx, true)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Sizes */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-755">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 4. Size / Storage Options ({selectedProduct.sizes?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddSizeItem(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-amber-500/30"
                  >
                    <Plus className="w-3 h-3" /> Add Size
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedProduct.sizes || []).map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Size Name"
                        value={s.name}
                        onChange={(e) => handleSizeChange(idx, "name", e.target.value, true)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Extra Price"
                        value={s.price || ""}
                        onChange={(e) => handleSizeChange(idx, "price", e.target.value, true)}
                        className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeItem(idx, true)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Specifications */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-755">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> 5. Technical Specifications ({selectedProduct.specifications?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddSpecItem(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-emerald-500/30"
                  >
                    <Plus className="w-3 h-3" /> Add Specification
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedProduct.specifications || []).map((sp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. Processor)"
                        value={sp.title}
                        onChange={(e) => handleSpecChange(idx, "title", e.target.value, true)}
                        className="w-1/3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Snapdragon 8 Gen 3)"
                        value={sp.content}
                        onChange={(e) => handleSpecChange(idx, "content", e.target.value, true)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecItem(idx, true)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
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
                  onClick={() => setShowEditProductModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditProduct}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submittingEditProduct ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    "Save Changes with All Variations"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: ADD VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" /> Register New Vendor
                </h3>
                <p className="text-[11px] text-slate-400">
                  Create an official vendor storefront account for brand partners.
                </p>
              </div>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Store / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Sound Labs"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@apexsound.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 800 555 0199"
                    value={vendorForm.mobile}
                    onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Store Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell customers about this vendor's specialty and authentic products..."
                  value={vendorForm.description}
                  onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Store Logo / Banner Image File Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-400" /> Store Logo / Banner Image
                  </label>
                  {uploadingVendorImage && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                    </span>
                  )}
                </div>

                {vendorForm.image ? (
                  <div className="flex items-center gap-3.5 p-3 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-inner">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                      <img
                        src={vendorForm.image}
                        alt="Vendor Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Logo uploaded
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {vendorForm.image}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-emerald-500/30">
                          <Upload className="w-3 h-3" /> Change File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingVendorImage}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadSingleImage(
                                  e.target.files[0],
                                  (url) => setVendorForm({ ...vendorForm, image: url }),
                                  setUploadingVendorImage,
                                  "vendors"
                                );
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setVendorForm({ ...vendorForm, image: "" })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-800/50 hover:bg-slate-800/90 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingVendorImage}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadSingleImage(
                            e.target.files[0],
                            (url) => setVendorForm({ ...vendorForm, image: url }),
                            setUploadingVendorImage,
                            "vendors"
                          );
                        }
                      }}
                    />
                    {uploadingVendorImage ? (
                      <div className="flex flex-col items-center py-1 text-emerald-400">
                        <RefreshCw className="w-6 h-6 animate-spin mb-1" />
                        <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          Click to browse or drop store logo / banner
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 12MB</p>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVendor}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submittingVendor ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create Vendor Store
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Add New Category
                </h3>
                <p className="text-[11px] text-slate-400">
                  Organize products into high-converting store departments.
                </p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Wearables, High-End Audio"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Banner Image File Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" /> Category Banner Image
                  </label>
                  {uploadingCategoryImage && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                    </span>
                  )}
                </div>

                {categoryForm.image ? (
                  <div className="flex items-center gap-3.5 p-3 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-inner">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                      <img
                        src={categoryForm.image}
                        alt="Category Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Banner attached
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {categoryForm.image}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-indigo-500/30">
                          <Upload className="w-3 h-3" /> Change File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCategoryImage}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadSingleImage(
                                  e.target.files[0],
                                  (url) => setCategoryForm({ ...categoryForm, image: url }),
                                  setUploadingCategoryImage,
                                  "categories"
                                );
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, image: "" })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
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
                      disabled={uploadingCategoryImage}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadSingleImage(
                            e.target.files[0],
                            (url) => setCategoryForm({ ...categoryForm, image: url }),
                            setUploadingCategoryImage,
                            "categories"
                          );
                        }
                      }}
                    />
                    {uploadingCategoryImage ? (
                      <div className="flex flex-col items-center py-1 text-indigo-400">
                        <RefreshCw className="w-6 h-6 animate-spin mb-1" />
                        <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1.5 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          Click to browse or drop category banner
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 12MB</p>
                      </div>
                    )}
                  </label>
                )}
              </div>

              {/* Quick Image Preset Badges */}
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1.5">
                  Or pick a royalty-free preset image:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Electronics", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" },
                    { label: "Fashion", url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80" },
                    { label: "Watches", url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80" },
                    { label: "Audio", url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, image: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[10px] font-semibold transition-all"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submittingCategory ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create Category
                    </>
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

export default AdminDashboard;
