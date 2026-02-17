import React, { useEffect } from 'react';
import { BookOpen } from 'lucide-react';

const Login = () => {
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
  }, []);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
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

          <button
            data-testid="google-login-btn"
            onClick={handleLogin}
            className="w-full btn-paper-accent text-base py-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;