import { useState } from "react";
import { Link } from 'react-router-dom';
import "./Auth.css";

function SignUp() {
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) =>{
        e.preventDefault();

        const response = await fetch("http://localhost:3000/auth/signup",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log(data);

    };

    return (
        <div className = "auth-container">
            <div className = "auth-card">
                <h2>Create Account</h2>

                <form onSubmit={handleSubmit}>
                    <input
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>

    );
} 
export default SignUp;