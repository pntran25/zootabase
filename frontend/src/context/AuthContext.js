import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { API_BASE_URL } from '../services/apiClient';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // Always set loading=true at the start so ProtectedRoute waits
            // for the profile fetch before deciding whether to redirect.
            setLoading(true);
            setCurrentUser(user);
            if (user) {
                // Fetch the user's role and details from SQL backend
                try {
                    const idToken = await user.getIdToken(true);

                    // First call the sync endpoint just in case it's a new login or sign up
                    await fetch(`${API_BASE_URL}/api/auth/sync`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    // Then fetch profile
                    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${idToken}`
                        }
                    });

                    if (response.ok) {
                        const profile = await response.json();
                        setUserProfile(profile);
                    } else {
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
