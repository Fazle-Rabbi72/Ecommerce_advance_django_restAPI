import { useState, useEffect } from "react";

function GetCurrentAddress() {
  const [address, setAddress] = useState({
    country: "United States",
    city: "New York",
    state: "NY",
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data?.address) {
              setAddress(data.address);
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