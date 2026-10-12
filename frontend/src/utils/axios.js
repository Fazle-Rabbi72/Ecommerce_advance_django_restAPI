import axios from "axios";
import cookies from "js-cookie";

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Automatically inject JWT Bearer Token on every request if logged in
apiInstance.interceptors.request.use(
  (config) => {
    const token = cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set multipart/form-data boundary automatically when sending FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiInstance;