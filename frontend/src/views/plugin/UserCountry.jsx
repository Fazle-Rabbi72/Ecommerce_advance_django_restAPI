import { useState, useEffect } from "react";

let cachedAddress = null;

function GetCurrentAddress() {
  const [address, setAddress] = useState(() => {
    if (cachedAddress) return cachedAddress;
    try {
      const stored = sessionStorage.getItem("cached_user_address");
      if (stored) {
        cachedAddress = JSON.parse(stored);
        return cachedAddress;
      }
    } catch (e) {}
    return {
      country: "United States",
      city: "New York",
      state: "NY",
    };
  });

  useEffect(() => {
    if (cachedAddress || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data?.address) {
              cachedAddress = data.address;
              setAddress(data.address);
              try {
                sessionStorage.setItem(
                  "cached_user_address",
                  JSON.stringify(data.address)
                );
              } catch (e) {}
            }
          })
          .catch((err) => {
            console.warn("Location reverse geocode lookup skipped:", err);
          });
      },
      () => {
        // Geolocation denied or unavailable - keep default fallback
      },
      { timeout: 5000 }
    );
  }, []);

  return address;
}

export default GetCurrentAddress;