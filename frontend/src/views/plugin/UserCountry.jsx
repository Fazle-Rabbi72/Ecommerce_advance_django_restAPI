import { useState, useEffect } from "react";

let cachedAddress = null;

function GetCurrentAddress() {
  const [address, setAddress] = useState(() => {
    if (cachedAddress) return cachedAddress;
    try {
      const stored =
        sessionStorage.getItem("cached_user_address") ||
        localStorage.getItem("cached_user_address");
      if (stored) {
        cachedAddress = JSON.parse(stored);
        return cachedAddress;
      }
    } catch (_e) {
      /* ignore storage error */
    }
    return {
      country: "Global",
      city: "",
      state: "",
    };
  });

  useEffect(() => {
    if (cachedAddress) return;

    let isMounted = true;

    // Fast, silent IP lookup for country detection without permission prompts
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.country_name) {
          const loc = {
            country: data.country_name,
            city: data.city || "",
            state: data.region || "",
            country_code: data.country_code || "",
          };
          cachedAddress = loc;
          setAddress(loc);
          try {
            localStorage.setItem("cached_user_address", JSON.stringify(loc));
          } catch (_e) {
            /* ignore storage error */
          }
        }
      })
      .catch(() => {
        // Fallback to HTML5 geolocation if IP lookup failed
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              const { latitude, longitude } = pos.coords;
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
              )
                .then((res) => res.json())
                .then((data) => {
                  if (data?.address?.country) {
                    const loc = {
                      country: data.address.country,
                      city: data.address.city || data.address.town || "",
                      state: data.address.state || "",
                    };
                    cachedAddress = loc;
                    setAddress(loc);
                    try {
                      localStorage.setItem(
                        "cached_user_address",
                        JSON.stringify(loc)
                      );
                    } catch (_e) {
                      /* ignore storage error */
                    }
                  }
                })
                .catch(() => {});
            },
            () => {},
            { timeout: 4000 }
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return address;
}

export default GetCurrentAddress;