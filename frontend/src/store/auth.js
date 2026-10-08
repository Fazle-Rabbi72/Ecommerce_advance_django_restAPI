import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";
import cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const useAuthStore = create((set) => ({
  allUserData: null,
  loading: true,
  isLoggedIn: false,
  user: null,

  setUser: (user) =>
    set({
      allUserData: user,
      user: user,
      isLoggedIn: Boolean(user),
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  hydrateUser: () => {
    const accessToken = cookies.get("access_token");
    if (!accessToken) {
      set({ allUserData: null, isLoggedIn: false, user: null, loading: false });
      return;
    }
    try {
      const decoded = jwtDecode(accessToken);
      set({
        allUserData: decoded,
        isLoggedIn: true,
        user: decoded,
        loading: false,
      });
    } catch (err) {
      console.error("Invalid token", err);
      set({ allUserData: null, isLoggedIn: false, user: null, loading: false });
    }
  },
}));

if (import.meta.env?.DEV) {
  try {
    mountStoreDevtool("Auth Store", useAuthStore);
  } catch {
    // ignore devtool mount error in test environments
  }
}

export { useAuthStore };
