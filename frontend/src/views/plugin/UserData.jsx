import Cookie from "js-cookie";
import { jwtDecode } from "jwt-decode";

function UserData() {
  let access_token = Cookie.get("access_token");
  let refresh_token = Cookie.get("refresh_token");

  try {
    if (access_token) {
      // Access token decode করা
      const decoded = jwtDecode(access_token);
      return decoded;
    } else {
      console.warn("No access token found!");
      return null;
    }
  } catch (error) {
    console.error("Invalid token:", error.message);
    return null;
  }
}

export default UserData;
