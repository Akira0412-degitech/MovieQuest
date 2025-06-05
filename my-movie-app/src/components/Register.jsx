import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';
import axios from 'axios';
import React from 'react';


function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setMessage("");
            return;
        } else if (password.length < 6) {
            setError("Length should be 6+ chars");
            return;
        } else if (!/[A-Z]/.test(password)) {
            setError("Must include at least one uppercase letter");
            return;
        } else if (!/[0-9]/.test(password)) {
            setError("Must include at least one number");
            return;
        } else {
            setError("");
        }

        try {
            const response = await axios.post("http://4.237.58.241:3000/user/register", {
                email,
                password
            });

            if (response.data.message === "User created") {
                setMessage("Successfully registered! Redirecting...");
                setError(null);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(response.data.message || "Registration failed");
                setMessage("");
            }
        } catch (err) {
            console.error(err);

            if(err.response && err.response.status === 409){
                setError("This email is alredy registered.");
            }else{
                setError("Server Error");
            }
            setMessage("");
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <h2 className="login-title">Create your account</h2>
                <h3 className="password-warning">Your password must include at least one uppercase letter, number and 6+ characters</h3>
                <form onSubmit={handleSubmit}>
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

                    <label className="login-label">Confirm Password</label>
                    <input
                        className="login-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {error && <p className="error-text">{error}</p>}
                    {message && <p className="successful-login">{message}</p>}

                    <button type="submit" className="login-button">Register</button>
                </form>
                <p className="login-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
