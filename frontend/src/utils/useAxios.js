import axios from "axios";
import { isAccessTokenExpired, setAuthUser, getRefreshToken } from "./auth";
import { BASE_URL } from "./constants";
import Cookies from "js-cookie";

const useAxios = () => {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  axiosInstance.interceptors.request.use(async (req) => {
    let access_token = Cookies.get("access_token");
    const refresh_token = Cookies.get("refresh_token");

    if (access_token && isAccessTokenExpired(access_token)) {
      if (refresh_token) {
        try {
          const response = await getRefreshToken(refresh_token);
          setAuthUser(response.access, response.refresh || refresh_token);
          access_token = response.access;
        } catch (error) {
          console.error("Failed to refresh token", error);
        }
      }
    }

    if (access_token) {
      req.headers.Authorization = `Bearer ${access_token}`;
    }

    return req;
  });

  return axiosInstance;
};

export default useAxios;
