import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import React from 'react';


function Login() {
  const API_URL = `http://4.237.58.241:3000`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/user/login`, {
        email,
        password
      });

      if (res.data.bearerToken) {
        localStorage.setItem("token", res.data.bearerToken.token);
        localStorage.setItem("refreshToken", res.data.refreshToken.token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("password", password);

        setMessage("Successfully logged in. Moving to previous page...");
        setError(null);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        setError(res.data.message || "Login failed.");
        setMessage("");
      }

    } catch (err) {
      console.error("Error occurred:", err);
      if(err.response && err.response.status === 401){
        setError("Incorrect email or password");
      }else{
        setError("Server error occurred");

      }
      setMessage("");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2 className="login-title">Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <label className="login-label">Email</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          {message && <p className='successful-login'>{message}</p>}

          <button type="submit" className="login-button" >Login</button>
        </form>
        <p className="login-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
