import React from "react";
import Skeleton from "@mui/material/Skeleton";

// Modern shimmering product card skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
      <div>
        {/* Product Image Skeleton */}
        <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-100 mb-4">
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ bgcolor: "#f1f5f9" }}
          />
        </div>

        {/* Category Pill Skeleton */}
        <div className="w-20 mb-2">
          <Skeleton
            variant="rounded"
            height={20}
            animation="wave"
            sx={{ borderRadius: "9999px", bgcolor: "#f1f5f9" }}
          />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-1 mb-3">
          <Skeleton variant="text" width="90%" height={24} animation="wave" />
          <Skeleton variant="text" width="60%" height={20} animation="wave" />
        </div>
      </div>

      <div>
        {/* Price & Rating Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width={55} height={28} animation="wave" />
            <Skeleton variant="text" width={40} height={20} animation="wave" />
          </div>
          <Skeleton variant="circular" width={28} height={28} animation="wave" />
        </div>

        {/* Action Button Skeleton */}
        <Skeleton
          variant="rounded"
          height={42}
          width="100%"
          animation="wave"
          sx={{ borderRadius: "12px", bgcolor: "#f1f5f9" }}
        />
      </div>
    </div>
  );
};

// Category circular skeleton
export const CategoryItemSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <Skeleton
        variant="circular"
        width={72}
        height={72}
        animation="wave"
        sx={{ bgcolor: "#f1f5f9" }}
      />
      <Skeleton variant="text" width={56} height={16} animation="wave" />
    </div>
  );
};

// Category card skeleton (Circular slider avatar matching modern design)
export const CategoryCardSkeleton = () => {
  return (
    <div className="flex flex-col items-center text-center shrink-0 w-28 sm:w-32 md:w-36 py-1 space-y-2">
      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#edf7ed] flex items-center justify-center p-3 sm:p-4">
        <Skeleton
          variant="circular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{ bgcolor: "#d8edd9" }}
        />
      </div>
      <Skeleton variant="text" width="70%" height={18} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
      <Skeleton variant="text" width="45%" height={14} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
    </div>
  );
};


// Product detail page skeleton
export const ProductDetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
      {/* Left Gallery Skeleton */}
      <div className="lg:col-span-6 space-y-4">
        <Skeleton
          variant="rounded"
          width="100%"
          height={480}
          animation="wave"
          sx={{ borderRadius: "1.25rem", bgcolor: "#f1f5f9" }}
        />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={80}
              height={80}
              animation="wave"
              sx={{ borderRadius: "0.75rem", bgcolor: "#f1f5f9" }}
            />
          ))}
        </div>
      </div>

      {/* Right Details Skeleton */}
      <div className="lg:col-span-6 space-y-5">
        <Skeleton variant="rounded" width={100} height={26} animation="wave" sx={{ borderRadius: "9999px" }} />
        <Skeleton variant="text" width="85%" height={40} animation="wave" />
        <Skeleton variant="text" width="50%" height={24} animation="wave" />

        <div className="flex items-center gap-4">
          <Skeleton variant="text" width={80} height={36} animation="wave" />
          <Skeleton variant="text" width={60} height={24} animation="wave" />
        </div>

        <div className="space-y-2 py-2">
          <Skeleton variant="text" width="100%" height={18} animation="wave" />
          <Skeleton variant="text" width="95%" height={18} animation="wave" />
          <Skeleton variant="text" width="75%" height={18} animation="wave" />
        </div>

        {/* Variation selectors skeleton */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <Skeleton variant="text" width={70} height={20} animation="wave" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" width={48} height={40} animation="wave" sx={{ borderRadius: "8px" }} />
            ))}
          </div>

          <Skeleton variant="text" width={70} height={20} animation="wave" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="circular" width={32} height={32} animation="wave" />
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Skeleton variant="rounded" width={120} height={48} animation="wave" sx={{ borderRadius: "12px" }} />
          <Skeleton variant="rounded" width="100%" height={48} animation="wave" sx={{ borderRadius: "12px" }} />
        </div>
      </div>
    </div>
  );
};

// Cart Item Skeleton
export const CartItemSkeleton = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 mb-3">
      <Skeleton
        variant="rounded"
        width={96}
        height={96}
        animation="wave"
        sx={{ borderRadius: "12px", bgcolor: "#f1f5f9" }}
      />
      <div className="flex-1 space-y-2 w-full">
        <Skeleton variant="text" width="70%" height={24} animation="wave" />
        <Skeleton variant="text" width="30%" height={18} animation="wave" />
        <Skeleton variant="text" width="20%" height={22} animation="wave" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" width={90} height={36} animation="wave" sx={{ borderRadius: "8px" }} />
        <Skeleton variant="text" width={60} height={24} animation="wave" />
        <Skeleton variant="circular" width={32} height={32} animation="wave" />
      </div>
    </div>
  );
};

// Order Row Skeleton
export const OrderRowSkeleton = () => {
  return (
    <tr className="border-b border-slate-100">
      <td className="p-4">
        <Skeleton variant="text" width={100} height={24} animation="wave" />
        <Skeleton variant="text" width={70} height={16} animation="wave" />
      </td>
      <td className="p-4">
        <Skeleton variant="rounded" width={75} height={24} animation="wave" sx={{ borderRadius: "9999px" }} />
      </td>
      <td className="p-4">
        <Skeleton variant="rounded" width={85} height={24} animation="wave" sx={{ borderRadius: "9999px" }} />
      </td>
      <td className="p-4">
        <Skeleton variant="text" width={60} height={24} animation="wave" />
      </td>
      <td className="p-4">
        <Skeleton variant="rounded" width={80} height={32} animation="wave" sx={{ borderRadius: "8px" }} />
      </td>
    </tr>
  );
};

// Summary Card Skeleton
export const SummarySkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
      <Skeleton variant="text" width={140} height={28} animation="wave" />
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton variant="text" width={90} height={20} animation="wave" />
            <Skeleton variant="text" width={60} height={20} animation="wave" />
          </div>
        ))}
      </div>
      <hr className="border-slate-100" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width={80} height={28} animation="wave" />
        <Skeleton variant="text" width={90} height={32} animation="wave" />
      </div>
      <Skeleton
        variant="rounded"
        height={48}
        width="100%"
        animation="wave"
        sx={{ borderRadius: "12px", bgcolor: "#f1f5f9" }}
      />
    </div>
  );
};
