import React from "react";
import Sidebar from "./Sidebar";
import { useState,useEffect } from "react";
import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

const Account = () => {
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
    <main className="mt-5">
      <div className="container">
        <section>
          <div className="row">
            
            <Sidebar/>
            {/* Right Content */}
            <div className="col-lg-9">
              <div className="p-4 shadow rounded bg-white">
                <h3 className="fw-bold">Hi, {profile.full_name}</h3>
                <p className="text-muted mt-3">
                  From your account dashboard you can easily check & view your{" "}
                  <strong>orders</strong>, manage your{" "}
                  <strong>password</strong> and edit{" "}
                  <strong>account information</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Account;
