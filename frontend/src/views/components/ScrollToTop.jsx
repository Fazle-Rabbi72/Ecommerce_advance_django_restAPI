import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Ensures page scroll is reset to the top whenever
 * navigating between routes, or smoothly scrolls to specific section IDs
 * when a hash is provided. Prevents getting stuck at the footer.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      // Wait for destination page content to mount
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 90; // Offset for sticky StoreHeader
          const y =
            element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, y),
            behavior: "smooth",
          });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      }, 80);
      return () => clearTimeout(timer);
    } else {
      // Normal route transition: instantly scroll to top of page
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
