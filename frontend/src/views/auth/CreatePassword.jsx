import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiInstance from "../../utils/axios";

const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const otp = searchParams.get("otp");
  const uidb64 = searchParams.get("uidb64");
  const reset_token = searchParams.get("reset_token"); // optional

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || !uidb64) {
      alert("Invalid or expired password reset link");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    const payload = {
      password: password,
      otp: otp,
      uidb64: uidb64,
      reset_token: reset_token, // use only if backend supports
    };

    try {
      const res = await apiInstance.post("user/password-change/", payload);

      alert("Password changed successfully!");
      navigate("/login");
    } catch (error) {
      console.error(error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Something went wrong while changing password.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card shadow-lg p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h3 className="text-center mb-4 text-primary fw-bold">
          Create New Password
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Enter New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePassword;
