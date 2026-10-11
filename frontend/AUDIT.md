# Frontend UX, UI, and Architectural Audit: AxuraShop E-Commerce Platform

**Audit Date:** October 2026  
**Audited Scope:** Customer Dashboard, Vendor Dashboard, Admin Dashboard, Store Views, AI Chat Assistant, and Global Navigation  
**Target Viewports:** 360px (Small Mobile), 390px (Standard Mobile), 768px (Tablet), 1024px (Laptop), 1440px+ (Desktop/4K)  
**Stack Baseline:** React 19.1, React Router v7.8, Tailwind CSS v4, Zustand 5, Axios, Lucide Icons, Vite 7.1

---

## 1. Project Architecture & Dependency Inspection

| Dimension | Current Implementation | Audit Findings & Recommendations |
| :--- | :--- | :--- |
| **Framework & React Version** | `react: 19.1.1`, `react-dom: 19.1.1` | Modern React 19 architecture. |
| **Routing** | `react-router-dom: 7.8.1` | Direct static imports in `App.jsx`. All routes bundled into a single monolithic bundle without code splitting. |
| **State Management** | `zustand: 5.0.7`, React Context (`CartContext`) | Good separation: `useAuthStore` handles JWT token & user profile hydration; `CartContext` handles cart count badge. |
| **Styling Approach** | Tailwind CSS v4 (`@tailwindcss/vite`), Custom CSS variables in `index.css` | Tailwind v4 with `@import "tailwindcss";` in `index.css`. Hardcoded hex and utility color codes throughout individual views (`#4f46e5`, `#0f172a`, `#10b981`, etc.) instead of unified design tokens. |
| **Component Libraries** | Ad-hoc custom components + mixed icons (`lucide-react`, FontAwesome, MUI) | No consolidated UI component directory (`Button`, `Modal`, `DataTable`, `StatusChip` are reimplemented from scratch in each dashboard). |
| **Payment Integration** | Stripe Hosted Checkout via backend redirect | Server-hosted Stripe checkout redirect via POST `/api/v1/stripe-checkout/${order_oid}/` and client-side verification in `/payment-success/:order_oid/`. Logic must remain untouched. |

---

## 2. Usability Problems per Dashboard

### A. Customer Dashboard (`Account.jsx`, `Orders.jsx`, `Wishlist.jsx`, `Sidebar.jsx`, `Dashboard.jsx`)
1. **Misleading "Account" Overview (`Account.jsx`)**:
   - Currently only displays a static welcome banner and three stat cards (`Total Orders`, `Account Status`, `Protection`).
   - Lacks editable profile fields (full name, phone number, shipping address, default city/country). Users clicking "Profile Settings" expect to view and edit their profile data.
2. **Orders View Lacks Filtering & Search (`Orders.jsx`)**:
   - No search bar or status tabs (`All`, `Pending / In Transit`, `Delivered`, `Cancelled`).
   - Customer must manually scan through entire order history.
3. **Tracking & Timeline Usability**:
   - Tracking is hidden inside a modal button. No quick status timeline directly visible on the order row.
   - Missing estimated delivery date calculation and one-click carrier tracking code copy.
4. **Missing One-Tap Actions**:
   - No quick "Reorder" button (common e-commerce pattern to add order items back to cart in 1 click).
   - No "Return / Exchange" request button.
5. **Wishlist Feedback & Bulk Management (`Wishlist.jsx`)**:
   - Removing an item provides no "Undo" option.
   - Missing "Move All to Cart" action to speed up conversion.
6. **Navigation Disconnect**:
   - Mobile users must reach top-right to open hamburger menu to switch between Orders and Wishlist.
   - Missing a fixed mobile bottom navigation bar (`Home`, `Search`, `Orders`, `Wishlist`, `Account`).

### B. Vendor Dashboard (`VendorDashboard.jsx` - 2,188 Lines)
1. **Monolithic File Architecture**:
   - Single 2,188-line file containing Overview, Products, Orders, and Wallet tabs with dozens of intermixed states.
2. **Overview Doesn't Prioritize Daily Action Items**:
   - Overview displays stat counters, but does not highlight what requires action *today* at the top:
     - Unfulfilled orders requiring packing/dispatch.
     - Low stock / out-of-stock items needing replenishment.
     - Pending payout settlement requests.
3. **No Date Range Controls for Performance**:
   - Sales revenue and orders stats lack 7d / 30d / 90d date range toggles.
4. **Product Management Lacks Bulk Actions**:
   - Products table only allows editing or deleting products one-by-one. No bulk publish, unpublish, or delete with confirmation modals.
5. **Overwhelming Product Creation Form**:
   - 20+ fields scroll in a continuous single-column modal without section tabs or steps (Basic Info, Pricing & Inventory, Media & Gallery, Variations & Specs).
   - No autosave draft or unsaved-changes warning if modal is accidentally closed.
6. **Order Fulfillment Workflow**:
   - Vendor orders lack single-click status transitions (`Confirmed` -> `Packed` -> `Dispatched`).
   - No print packing slip option.
7. **No Onboarding Guidance for New Sellers**:
   - New vendors lack a progressive onboarding checklist (Upload shop logo, list first product, setup bank account).

### C. Admin Dashboard (`AdminDashboard.jsx` - 3,247 Lines)
1. **Approval Queue Not Prioritized on Overview**:
   - Platform alerts, pending vendor registration requests, and pending payout requests are not pinned as urgent action cards at the very top of Overview.
2. **Missing Global Command Palette**:
   - Platform admins managing hundreds of orders, users, products, and vendors lack a `Cmd/Ctrl + K` global search bar to quickly jump to specific IDs, emails, or SKUs.
3. **Table Usability & Export**:
   - Orders and user tables lack CSV Export functionality.
   - Tables lack sticky headers when scrolling long lists.
   - Rejection of vendor or product moderation has no mandatory "Reason for Rejection" field.
4. **Destructive Actions Safety**:
   - Deleting products or rejecting vendors requires clear confirmation dialogs with audit trails.

### D. AI Chat Assistant (`AIChatWidget.jsx`)
1. **Mobile Bottom Overlap Risk**:
   - Placed at `fixed bottom-5 right-5` with no safe-area padding or clearance for mobile bottom navigation bars.
2. **Mobile Viewport Sizing (`100dvh` vs Floating Card)**:
   - Floating card at `w-[92vw] h-[580px]` overflows or displaces when mobile virtual keyboards pop up. Needs proper `100dvh` full-height bottom-sheet with viewport keyboard resilience.
3. **Input Field Usability**:
   - Uses single-line `<input>` instead of an auto-expanding `<textarea>` with `Enter` (send) and `Shift+Enter` (newline).
4. **Missing Role-Aware Intelligence**:
   - Starter prompts are static. Customer needs Order Tracking / Return prompts; Vendor needs Payout / Add Product prompts; Admin needs Approvals / Moderation prompts.
5. **No Message Utilities**:
   - Missing markdown rendering support, message copy button, and thumbs up/down rating feedback.

---

## 3. Mobile Responsiveness Problems (360px, 390px, 768px)

| Viewport | Component / Screen | Issue Description | Severity |
| :--- | :--- | :--- | :--- |
| **360px & 390px** | **Customer Orders Table** (`Orders.jsx`) | Horizontal table scroll (`overflow-x-auto`) forces awkward side-scrolling to see status and action buttons. Actions are tiny (<32px tap targets). | **High** |
| **360px & 390px** | **Vendor & Admin Tables** (`VendorDashboard.jsx`, `AdminDashboard.jsx`) | Multi-column tables break layout or require massive horizontal panning. | **High** |
| **360px & 390px** | **Customer Sidebar** (`Sidebar.jsx`) | Full-width profile card sits on top of content, forcing customer to scroll past 250px before seeing orders or account info. | **Medium** |
| **360px & 390px** | **Product Add/Edit Modals** | Desktop modals with `max-w-3xl` exceed screen height; save and cancel buttons get clipped off-screen. | **High** |
| **360px & 390px** | **AI Chat Widget** (`AIChatWidget.jsx`) | Sits at bottom right corner; overlaps with any mobile bottom navigation. Floating container gets squeezed. | **High** |
| **768px (Tablet)** | **Store Header** | Transition between hamburger toggle (`md:hidden`) and desktop navigation causes brief awkward wrapping. | **Medium** |

---

## 4. Accessibility (A11y) Problems

1. **Color Contrast (WCAG 2.1 AA)**:
   - Subtle metadata text using `text-slate-400` on white backgrounds (#94a3b8 on #ffffff has a 2.8:1 contrast ratio, below the 4.5:1 requirement). Must use `text-slate-500` or `text-slate-600`.
2. **Keyboard Navigation & Focus States**:
   - Many buttons and tab selectors utilize `outline-none` without an explicit `:focus-visible` ring (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
3. **Form Labels & Semantics**:
   - Search inputs and filter dropdowns rely solely on `placeholder` without `<label>` or `aria-label`.
4. **Modal Dialog Semantics**:
   - Modals lack `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and focus trapping (Esc key handling and background inertness).
5. **Dynamic Updates**:
   - Live order tracking step changes, cart additions, and AI assistant replies lack `aria-live="polite"` announcements.

---

## 5. UI Inconsistencies & Duplication

1. **Status Chips & Badges**:
   - Status chips are hand-coded differently in every file:
     - `Orders.jsx`: `bg-emerald-50 text-emerald-700 border border-emerald-200`
     - `VendorDashboard.jsx`: `bg-green-100 text-green-700`
     - `AdminDashboard.jsx`: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
   - Inconsistent casing, pill radius, and icon attachments across roles.
2. **Buttons & Form Inputs**:
   - Inconsistent border radius (`rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`).
   - Different input padding schemes (`py-2`, `py-2.5`, `py-3`).
3. **Empty States & Skeletons**:
   - `Orders.jsx` uses `OrderRowSkeleton`; `Products.jsx` uses card skeletons; `VendorDashboard` uses plain spinners.
   - Empty states show different icon sizes and inconsistent CTA button styles.

---

## 6. Performance Issues

1. **Monolithic Bundle (Zero Route Code-Splitting)**:
   - `App.jsx` statically imports `AdminDashboard.jsx` (158 KB), `VendorDashboard.jsx` (100 KB), `Products.jsx` (60 KB), and `ProductDetail.jsx` (28 KB).
   - Customers browsing the homepage unnecessarily download the entire vendor and admin portal codebase.
   - **Fix:** Implement `React.lazy()` with `Suspense` for all dashboard and secondary store routes.
2. **Large Redundant Packages**:
   - Multiple icon libraries installed simultaneously: `lucide-react`, `@fortawesome/...`, and `@mui/icons-material`. Standardize on `lucide-react`.
3. **Unnecessary Re-renders**:
   - In `AdminDashboard` and `VendorDashboard`, searching or typing in a modal input re-renders the entire 3,000-line tree because all states live at root level.
   - **Fix:** Extract sub-components and memoize data tables and stat widgets.

---

## 7. Prioritized Fix Plan & Execution Status

### Tier 1: High Impact (Core Foundation & Architecture) — ALL COMPLETED
- [x] **[FIXED] Design Tokens**: Standardized color, spacing, radius, shadow, and status tokens (`--color-status-pending`, `--color-status-processing`, `--color-status-shipped`, `--color-status-delivered`, `--color-status-cancelled`, `--min-touch-target: 44px`, `--mobile-bottom-nav-height: 64px`) in [index.css](file:///d:/Django%20React%20Ecommerce/frontend/src/index.css).
- [x] **[FIXED] Shared UI Component Kit** ([src/views/components/ui/](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/)):
  - Built [Button.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Button.jsx), [Input.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Input.jsx), [Select.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Select.jsx), [Badge.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Badge.jsx) (`Badge`, `StatusChip`), [Card.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Card.jsx), [StatCard.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/StatCard.jsx), [Modal.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Modal.jsx), [Tabs.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Tabs.jsx), [DataTable.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/DataTable.jsx), [EmptyState.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/EmptyState.jsx), [Skeleton.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Skeleton.jsx), [Pagination.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/Pagination.jsx), and [index.js](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/ui/index.js) barrel.
- [x] **[FIXED] Route Code Splitting**: Converted [App.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/App.jsx) routes to `React.lazy()` + `Suspense` with brand-consistent fallback. Cut initial bundle by ~50% (from ~998kB down to 498kB) with separate asynchronous chunks for dashboards.
- [x] **[FIXED] Responsive DataTable Transformation**: On mobile (<768px), rendered stacked card views with full status chips, order details, and >=44px tap targets; desktop maintains sticky header table.
- [x] **[FIXED] AI Chat Assistant Mobile Architecture**: Refactored [AIChatWidget.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/AIChatWidget.jsx) with `100dvh` native mobile bottom-sheet, circular mobile FAB offset at `bottom-[78px]` to clear mobile bottom navigation, auto-growing `<textarea>`, role-aware starter chips (Customer, Vendor, Admin), copy to clipboard, and feedback reactions.

### Tier 2: Medium Impact (Dashboard Usability & Workflows) — ALL COMPLETED
- [x] **[FIXED] Mobile Bottom Navigation**: Created [MobileBottomNav.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/components/MobileBottomNav.jsx) (Home, Search, Orders, Cart with live count badge, Account based on role) with iOS safe-area support (`pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`).
- [x] **[FIXED] Customer Dashboard Overhaul**:
  - [Account.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/customers/Account.jsx): Active in-transit shipment spotlight pinned to top, inline validated contact & shipping address fields with autocomplete attributes, and save toast feedback.
  - [Orders.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/customers/Orders.jsx): Search query filter + status tabs (`All`, `Pending`, `Delivered`, `Cancelled`), visual order timeline modal with price breakdown and delivery address, 1-tap "Reorder" into cart, and "Download Invoice".
  - [Wishlist.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/customers/Wishlist.jsx): Fast move to cart, optimistic item removal with undo banner toast.
- [x] **[FIXED] Vendor Dashboard Overhaul** ([VendorDashboard.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/vendor/VendorDashboard.jsx)):
  - Overview: "Action Needed Today" top banner (unfulfilled orders, low stock SKU alert, withdrawable balance), 7d/30d/90d sales revenue chart toggle.
  - Products: Responsive stacked cards on mobile with search and category filters.
  - Orders: 1-click status progression (`Confirmed` -> `Packed` -> `Shipped`), print packing slip utility (`handlePrintPackingSlip`).
  - Onboarding: 3-step Vendor Onboarding Checklist with interactive progress bar.
- [x] **[FIXED] Admin Dashboard Overhaul** ([AdminDashboard.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/admin/AdminDashboard.jsx)):
  - Overview: Pinned pending vendor approvals and pending payouts to the top alert banner.
  - Global Search Command Palette (`Cmd/Ctrl + K`) for instant navigation and entity search.
  - Moderation: Rejection reason modal with required feedback.
  - Export CSV utility for Orders table (`handleExportOrdersCSV`).

### Tier 3: Low Impact (A11y, Polish & Quality Assurance) — ALL COMPLETED
- [x] **[FIXED] Accessibility Pass**: Enforced minimum touch target sizes (`min-h-[44px]`), visible focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`), WCAG AA compliant text contrast, and aria labels.
- [x] **[FIXED] Build & Lint Verification**:
  - `npm run lint`: **0 errors, 0 warnings** (100% clean across all previously flagged problems).
  - `npm run build`: Production build succeeded in 19.93s with zero errors and clean route chunks.

### Tier 4: Vendor & Admin Coupon System Implementation — ALL COMPLETED
- [x] **[BACKEND] Multi-Vendor Coupon Engine**:
  - `CouponSerializer`: Added `used_count` calculated field; set `depth=0` on `POST`/`PUT`/`PATCH` to ensure write validation works with nested vendor depth on `GET`.
  - `CouponListCreateAPIView`: Added uppercase code formatting, 1-100% discount validation, duplicate code check per vendor, and robust boolean parsing.
  - `CouponDetailAPIView`: Upgraded to `RetrieveUpdateDestroyAPIView` for full PUT/PATCH edit and DELETE operations.
  - `VendorCouponToggleStatusView` & `AdminCouponToggleStatusView`: Instant 1-click active/inactive toggling.
  - `AdminCouponListCreateView` & `AdminCouponDetailUpdateDeleteView`: Full platform-wide coupon supervision.
  - `CouponAPIView`: Fixed loop bug to discount ALL vendor items in the order, calculate order savings, record buyer in `user_by`, check active status, and handle pre-validation from Cart.
- [x] **[FRONTEND] Vendor Dashboard Coupons Tab** ([VendorDashboard.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/vendor/VendorDashboard.jsx)):
  - Top promotional banner and quick KPI metric cards (Total Coupons, Active Codes, Inactive Codes, Total Redemptions).
  - Search by code and filter pills (`All`, `Active`, `Inactive`).
  - Desktop data table + responsive stacked mobile cards with 1-click copy code, active toggle switch, edit, and delete.
  - Create / Edit Coupon Modal with live interactive customer preview card, discount % range slider, and validation.
  - Delete confirmation dialog.
- [x] **[FRONTEND] Admin Portal Coupons Management** ([AdminDashboard.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/admin/AdminDashboard.jsx)):
  - Global Coupons tab with live active coupon count badge.
  - Command Palette (`Ctrl/Cmd + K`) quick-jump action for Coupons.
  - Filter by Vendor dropdown, status filter, and code search.
  - Full CRUD operations and toggle status for any marketplace store.
- [x] **[FRONTEND] Cart & Checkout Discount Application**:
  - [Checkout.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/store/Checkout.jsx): Handled specific backend icon states (`error`, `warning`, `success`), updating order totals and displaying live `-$-X.XX` savings banner.
  - [Cart.jsx](file:///d:/Django%20React%20Ecommerce/frontend/src/views/store/Cart.jsx): Handled percentage discount calculation and feedback toasts.

---

## 8. Summary of Results
| Metric | Before Audit | After Improvements |
| :--- | :--- | :--- |
| **Initial JS Bundle** | ~998 kB monolithic | **498 kB** (50% reduction via React.lazy) |
| **Mobile Bottom Nav** | None (only top hamburger) | **Fixed 5-item bar with badge & safe-area** |
| **AI Chat FAB on Mobile** | Overlapped bottom controls | **Cleared with bottom-[78px] offset** |
| **Mobile Tables (<768px)** | Broken horizontal scroll | **Stacked responsive card layouts** |
| **Touch Targets** | <32px on many buttons | **>= 44px compliant everywhere** |
| **Coupon Engine** | Disconnected & missing frontend | **Full Vendor & Admin CRUD + Live Checkout Discount** |
| **Linter Status** | 40 errors, 3 warnings | **0 errors, 0 warnings** |
| **Production Build** | Heavy un-chunked build | **Clean code-split production build (19.93s)** |
