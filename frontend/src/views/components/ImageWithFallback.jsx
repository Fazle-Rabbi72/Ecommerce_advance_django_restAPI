import React, { useState } from "react";

const ImageWithFallback = ({
  src,
  alt = "Product Image",
  className = "",
  style = {},
  fallbackSrc,
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // High quality SVG placeholder with shopping bag pattern
  const defaultPlaceholder =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

  let effectiveSrc = src;
  if (typeof effectiveSrc === "string" && effectiveSrc.includes("media/http")) {
    const idx = effectiveSrc.indexOf("media/http");
    effectiveSrc = effectiveSrc.substring(idx + 6);
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Shimmer placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-100 skeleton-shimmer z-0" />
      )}

      <img
        src={error ? (fallbackSrc || defaultPlaceholder) : (effectiveSrc || defaultPlaceholder)}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default ImageWithFallback;
