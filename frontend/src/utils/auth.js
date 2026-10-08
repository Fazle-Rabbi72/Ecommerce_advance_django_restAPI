import { useAuthStore } from "../store/auth";
import axios from "./axios";
import { jwtDecode } from "jwt-decode";
import cookies from "js-cookie";
import { showToast } from "./toast";

export const login = async (email, password) => {
  try {
    const { data, status } = await axios.post("user/token/", {
      email,
      password,
    });

    if (status === 200) {
      setAuthUser(data.access, data.refresh);
    }
    showToast.success("Logged in successfully");

    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      "Invalid credentials or server error";
    showToast.error(errorMessage);
    return { data: null, error: errorMessage };
  }
};

export const register = async (full_name, email, phone, password, password2) => {
  try {
    const { data } = await axios.post("user/register/", {
      full_name,
      email,
      phone,
      password,
      password2,
    });

    await login(email, password);
    showToast.success("Account created successfully");
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      "Registration failed. Please check your information.";
    showToast.error(errorMessage);
    return {
      data: null,
      error: errorMessage,
    };
  }
};

export const logout = () => {
  cookies.remove("access_token");
  cookies.remove("refresh_token");
  useAuthStore.getState().setUser(null);
  showToast.success("Logged out successfully");
};

export const setUser = async () => {
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");
  if (!accessToken || !refreshToken) {
    useAuthStore.getState().setLoading(false);
    return;
  }

  if (isAccessTokenExpired(accessToken)) {
    try {
      const response = await getRefreshToken(refreshToken);
      setAuthUser(response.access, response.refresh || refreshToken);
    } catch {
      cookies.remove("access_token");
      cookies.remove("refresh_token");
      useAuthStore.getState().setUser(null);
    }
  } else {
    setAuthUser(accessToken, refreshToken);
  }
};

export const setAuthUser = (access_token, refresh_token) => {
  if (access_token) {
    cookies.set("access_token", access_token, {
      expires: 1,
      secure: window.location.protocol === "https:",
      sameSite: "Lax",
    });
  }
  if (refresh_token) {
    cookies.set("refresh_token", refresh_token, {
      expires: 7,
      secure: window.location.protocol === "https:",
      sameSite: "Lax",
    });
  }

  try {
    const user = access_token ? jwtDecode(access_token) : null;
    useAuthStore.getState().setUser(user);
  } catch (err) {
    console.error("Token decode error:", err);
    useAuthStore.getState().setUser(null);
  }

  useAuthStore.getState().setLoading(false);
};

export const getRefreshToken = async (refreshTokenParam) => {
  const refreshToken = refreshTokenParam || cookies.get("refresh_token");
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await axios.post("user/token/refresh/", {
    refresh: refreshToken,
  });
  return response.data;
};

export const isAccessTokenExpired = (access_token) => {
  if (!access_token) return true;
  try {
    const decoded = jwtDecode(access_token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error(error);
    return true;
  }
};