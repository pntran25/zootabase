import { useState } from "react";
import { Link } from 'react-router-dom';
import "./Auth.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const handleSubmit = async (e) =>{
        e.preventDefault();

        const response = await fetch("http://localhost:3000/auth/login",
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
                <h2>Login</h2>
                
                <form onSubmit={handleSubmit}>
                    <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                    
                    <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>

                <p>
                    Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
            
            </div>
        </div>
       
    );
}

export default Login;

