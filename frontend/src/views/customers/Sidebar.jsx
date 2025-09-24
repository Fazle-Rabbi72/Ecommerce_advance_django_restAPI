import React from "react";
import { useState,useEffect } from "react";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

const Sidebar = () => {
  const [profile, setProfile] =useState({})

  const user_data=UserData()

  useEffect(()=>{
    apiInstance.get(`user/profile/${user_data?.user_id}/`).then((res)=>{
      setProfile(res.data)
      console.log(res.data)
      console.log(res.data.image)
    })
  },[])

  return (
    <>
      {/* Left Sidebar */}
      <div className="col-lg-3 mb-4">
        <div className="d-flex justify-content-center align-items-center flex-column p-3 shadow rounded">
          <img
            src={profile.image}
            alt="profile"
            className="rounded-circle mb-3"
            style={{ width: 120, height: 120, objectFit: "cover" }}
          />
          <div className="text-center">
            <h5 className="mb-1">{profile.full_name}</h5>
            <a href="#" className="text-decoration-none text-primary">
              Edit Account
            </a>
          </div>
        </div>

        {/* Sidebar Menu */}
        <ol className="list-group shadow rounded mt-2">
          <li className="list-group-item fw-bold">Account</li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            <span className="fw-bold">Orders</span>
            <span className="badge bg-primary rounded-pill">12</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            <span className="fw-bold">Wishlist</span>
            <span className="badge bg-primary rounded-pill">12</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            <span className="fw-bold">Notification</span>
            <span className="badge bg-primary rounded-pill">12</span>
          </li>
          <li className="list-group-item fw-bold">Setting</li>
        </ol>
      </div>
    </>
  );
};

export default Sidebar;
