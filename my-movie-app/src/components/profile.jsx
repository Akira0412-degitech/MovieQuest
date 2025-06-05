import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import '../App.css';
import React from 'react';


function Profile() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const [redirecting, setRedirecting] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const password = localStorage.getItem("password");

  useEffect(() => {
    if (!userEmail) {
      setRedirecting(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [userEmail, navigate]);

  if (redirecting) {
    return (
      <div className="fullscreen" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 className="text-body">
            This is a profile page for logged in users <br />
            You need to login first... Redirecting to login page...</h2>
      </div>
    );
  }

  return (
    <div className="fullscreen">
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <div className="profile-card">
          <h1 className="text-heading">User Profile</h1>
          <div className="profile-info">
            <div className="info-box">
              <p className="label">Email</p>
              <p className="value">{userEmail}</p>
            </div>
            <div className="info-box">
              <p className="label">Password</p>
              <p className="value">{isPasswordOpen ? password : "••••••••"}</p>
              <button onClick={() => setIsPasswordOpen(!isPasswordOpen)}>
                {isPasswordOpen ? "Hide" : "View"}
            </button>
            </div>
          </div>
        </div>
        <Link to="/Home">
          <button className="btn-main" style={{ marginTop: "20px" }}>Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default Profile;
