import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing (especially in StrictMode)
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSessionId = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          throw new Error('No session_id found');
        }

        // Exchange session_id for user data
        const response = await api.post('/auth/session', { session_id: sessionId });
        const { user, session_token } = response.data;

        // Store token for mobile fallback
        if (session_token) {
          localStorage.setItem('session_token', session_token);
        }

        // Check if onboarding is needed
        if (!user.reading_type) {
          navigate('/onboarding', { replace: true, state: { user } });
        } else {
          navigate('/dashboard', { replace: true, state: { user } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    processSessionId();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A68A64] border-r-transparent"></div>
        <p className="mt-4 text-[#6A645C]">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;