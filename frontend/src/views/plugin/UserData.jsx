import Cookie from "js-cookie";
import { jwtDecode } from "jwt-decode";

function UserData() {
  const access_token = Cookie.get("access_token");

  try {
    if (access_token) {
      const decoded = jwtDecode(access_token);
      return decoded;
    }
    return null;
  } catch (error) {
    console.error("Invalid token:", error?.message);
    return null;
  }
}

export default UserData;
