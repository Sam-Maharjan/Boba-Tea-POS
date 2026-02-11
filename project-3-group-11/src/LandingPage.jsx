import { Link, useNavigate } from 'react-router-dom';
import React, { use, useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import './LandingPage.css';

export default function LandingPage() {
    const { isSignedIn, user, isLoaded } = useUser();
    const [employees, setEmployees] = useState([]);
    const navigate = useNavigate();
    const API_BASE = process.env.REACT_APP_BACKEND_URL;
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchEmployees();
        document.documentElement.style.fontSize = `16px`;
        document.body.style.fontFamily = `system-ui, sans-serif`;
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/employees`);
        if (!response.ok) throw new Error("Failed to fetch employees");
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            setEmployees([]);
        } 
        setLoading(false);
    };

    function handleEmployee(link) {
        if(!isSignedIn) {
            alert("Please sign in to access this screen.");
            return;
        }
        const user_email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
        const matchedEmployee = employees.find(emp => emp.email === user_email);

        if (matchedEmployee && (matchedEmployee.role === 'Manager' || (matchedEmployee.role === 'Cashier' && link === '/cashier'))) {
            navigate(link);
        } else {
            alert("You do not have access to this screen.");
        }
    }


    if (!isLoaded || loading) {
        return (
            <div className="landing-page">
                <h1>Loading...</h1>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="landing-page">
                <h1>Welcome to the Tea Shop</h1>
                <div className="button-container">
                    <button className="nav-button" onClick={() => handleEmployee('/cashier')}>
                        Cashier Screen
                    </button>

                    <button className="nav-button" onClick={() => handleEmployee('/manager')}>
                        Manager Screen
                    </button>

                    <Link to="/customer">
                        <button className="nav-button">
                            Customer Screen
                        </button>
                    </Link>

                    <Link to="/menu">
                        <button className="nav-button">
                            Menu Screen
                        </button>
                    </Link>

                    <SignInButton mode="modal">
                        <button className="nav-button google-login">
                            🔐 Sign In
                        </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <button className="nav-button">
                            📝 Sign Up
                        </button>
                    </SignUpButton>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page">
            <h1>Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!</h1>

            <div className="button-container">
                <button className="nav-button" onClick={() => handleEmployee('/cashier')}>
                    Cashier Screen
                </button>

                <button className="nav-button" onClick={() => handleEmployee('/manager')}>
                    Manager Screen
                </button>

                <Link to="/customer">
                    <button className="nav-button">
                        Customer Screen
                    </button>
                </Link>

                <Link to="/menu">
                    <button className="nav-button">
                        Menu Screen
                    </button>
                </Link>

                <UserButton afterSignOutUrl="/" />
            </div>
        </div>
    );
}