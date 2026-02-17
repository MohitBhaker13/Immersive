import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// Check if Google OAuth is configured (you set this in your .env)
const USE_GOOGLE_OAUTH = process.env.REACT_APP_USE_GOOGLE_OAUTH === 'true';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const LoginWithGoogle = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          window.location.href = '/dashboard';
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();

    // Load Google Sign-In script if using Google OAuth
    if (USE_GOOGLE_OAUTH && GOOGLE_CLIENT_ID) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });

        // Render the button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 400,
          }
        );
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [navigate]);

  const handleGoogleCallback = async (response) => {
    try {
      // Send Google ID token to backend
      const result = await api.post('/auth/google', {
        credential: response.credential,
      });

      const user = result.data;

      // Check if onboarding is needed
      if (!user.reading_type) {
        navigate('/onboarding', { state: { user } });
      } else {
        navigate('/dashboard', { state: { user } });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const handleEmergentLogin = () => {
    // Use Emergent managed auth
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1] paper-texture px-4">
      <div className="max-w-md w-full">
        <div className="card-paper p-8 md:p-12 text-center">
          <div className="mb-6 md:mb-8">
            <BookOpen className="w-14 h-14 md:w-16 md:h-16 mx-auto text-[#A68A64] mb-4" />
            <h1 
              className="text-4xl md:text-5xl font-bold text-[#2C2A27] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Immersive
            </h1>
            <p className="text-[#6A645C] text-base md:text-lg" style={{ fontFamily: 'Lora, serif' }}>
              Turn reading into an experience
            </p>
          </div>
          
          <div className="space-y-4 mb-6 md:mb-8">
            <p className="text-[#2C2A27] leading-relaxed text-sm md:text-base" style={{ fontFamily: 'Lora, serif' }}>
              Create the perfect atmosphere for every book.
              Track your journey. Build your streak.
            </p>
          </div>

          {USE_GOOGLE_OAUTH && GOOGLE_CLIENT_ID ? (
            // Standard Google OAuth Button
            <div className="flex flex-col items-center space-y-4">
              <div id="google-signin-button" data-testid="google-login-btn"></div>
              <p className="text-xs text-[#9B948B]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sign in with your Google account
              </p>
            </div>
          ) : (
            // Emergent Managed Auth Button (Fallback)
            <div>
              <button
                data-testid="google-login-btn"
                onClick={handleEmergentLogin}
                className="w-full btn-paper-accent text-base py-3"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Continue with Google
              </button>
              <p className="text-xs text-[#9B948B] mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Using Emergent managed authentication
              </p>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        {!USE_GOOGLE_OAUTH && (
          <div className="mt-6 p-4 bg-white border border-[#E8E3D9] rounded-lg">
            <p className="text-sm text-[#6A645C] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <strong>Want to use your own Google OAuth?</strong>
            </p>
            <p className="text-xs text-[#9B948B]" style={{ fontFamily: 'Inter, sans-serif' }}>
              1. Follow <code>/app/MONGODB_GOOGLE_SETUP.md</code><br/>
              2. Add <code>REACT_APP_USE_GOOGLE_OAUTH=true</code> to <code>/app/frontend/.env</code><br/>
              3. Add <code>REACT_APP_GOOGLE_CLIENT_ID=your-client-id</code> to <code>/app/frontend/.env</code><br/>
              4. Restart frontend
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginWithGoogle;
