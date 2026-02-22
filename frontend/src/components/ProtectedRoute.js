import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';

const AUTH_CACHE_KEY = 'immersive_auth_cache';
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * PERF: Caches the auth result in localStorage with a 5-min TTL.
 * This eliminates the /auth/me call on every page navigation,
 * saving ~300ms per page switch after the first check.
 */
const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const { user, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < AUTH_CACHE_TTL) {
      return user;
    }
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    localStorage.removeItem(AUTH_CACHE_KEY);
  }
  return null;
};

const setCachedUser = (user) => {
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
    user,
    timestamp: Date.now()
  }));
};

export const clearAuthCache = () => {
  localStorage.removeItem(AUTH_CACHE_KEY);
};

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Try cache first for instant render (no spinner)
  const cachedUser = location.state?.user || getCachedUser();

  const [isAuthenticated, setIsAuthenticated] = useState(cachedUser ? true : null);
  const [user, setUser] = useState(cachedUser);

  useEffect(() => {
    // Already have a valid user from cache or from location state — skip network
    if (user && isAuthenticated) {
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
        setCachedUser(response.data);
      } catch (error) {
        setIsAuthenticated(false);
        clearAuthCache();
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate, location.state, user, isAuthenticated]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A68A64] border-r-transparent"></div>
          <p className="mt-4 text-[#6A645C]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Pass user data to children
  return React.cloneElement(children, { user });
};

export default ProtectedRoute;