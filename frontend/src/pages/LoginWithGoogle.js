import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, Flame, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// Check if Google OAuth is configured
const USE_GOOGLE_OAUTH = process.env.REACT_APP_USE_GOOGLE_OAUTH === 'true';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "One must always be careful of books, for words have the power to change us.", author: "Cassandra Clare" },
  { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
  { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Sleep is good, he said, and books are better.", author: "George R.R. Martin" },
  { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
];

const LoginWithGoogle = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteVisible, setQuoteVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleCallback = useCallback(async (response) => {
    try {
      const result = await api.post('/auth/google', {
        credential: response.credential,
      });

      const { user, session_token } = result.data;

      if (session_token) {
        localStorage.setItem('session_token', session_token);
      }

      if (!user.reading_type) {
        navigate('/onboarding', { state: { user } });
      } else {
        navigate('/dashboard', { state: { user } });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in with Google');
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          window.location.href = '/dashboard';
        }
      } catch (error) { }
    };
    checkAuth();

    if (USE_GOOGLE_OAUTH && GOOGLE_CLIENT_ID) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
          }
        );
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [navigate, handleGoogleCallback]);

  // Rotate quotes every 6 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setQuoteVisible(true);
      }, 500); // fade-out duration
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergentLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    { icon: Headphones, label: 'Ambience', desc: 'Curated soundscapes', delay: '100ms' },
    { icon: Flame, label: 'Streaks', desc: 'Track your consistency', delay: '200ms' },
    { icon: Sparkles, label: 'Focus', desc: 'Distraction-free mode', delay: '300ms' },
  ];

  const quote = QUOTES[quoteIndex];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8F6F1] flex flex-col items-center justify-center p-4 md:p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#A68A64] opacity-5 rounded-full blur-3xl transform transition-transform duration-[20s] ease-in-out ${mounted ? 'translate-x-10 translate-y-10 scale-110' : ''}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#2C2A27] opacity-5 rounded-full blur-3xl transform transition-transform duration-[25s] ease-in-out ${mounted ? '-translate-x-10 -translate-y-10 scale-105' : ''}`} />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">

        {/* Hero Card */}
        <div className="card-paper p-8 md:p-10 text-center shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative mb-6 inline-block">
            <BookOpen className="relative w-16 h-16 mx-auto text-[#A68A64] drop-shadow-sm" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#2C2A27] mb-3 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Immersive
          </h1>
          <p className="text-[#6A645C] text-lg font-medium mb-6" style={{ fontFamily: 'Lora, serif' }}>
            Your portal to deep reading.
          </p>

          {/* Dynamic Quote Section */}
          <div className="min-h-[80px] flex items-center justify-center border-t border-[#E8E3D9] pt-6 mt-2">
            <div
              className="transition-opacity duration-500"
              style={{ opacity: quoteVisible ? 1 : 0 }}
            >
              <p className="text-[#2C2A27] text-sm md:text-base italic leading-relaxed" style={{ fontFamily: 'Lora, serif' }}>
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-[#9B948B] text-[10px] md:text-xs mt-2 uppercase tracking-widest font-medium">
                — {quote.author}
              </p>
            </div>
          </div>
        </div>

        {/* Value Prop Cards - Staggered Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm border border-[#E8E3D9] rounded-xl p-3 md:p-4 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards"
              style={{ animationDelay: f.delay }}
            >
              <f.icon className="w-6 h-6 mx-auto text-[#A68A64] mb-2" />
              <div className="font-bold text-[#2C2A27] text-xs md:text-sm uppercase tracking-wide mb-0.5">{f.label}</div>
              <div className="text-[10px] md:text-xs text-[#9B948B] leading-tight hidden md:block">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Login Action Card */}
        <div className="card-paper p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 shadow-lg mt-2">
          {USE_GOOGLE_OAUTH && GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div id="google-signin-button" className="w-full flex justify-center" data-testid="google-login-btn"></div>
              <p className="text-xs text-[#9B948B] font-medium tracking-wide items-center flex gap-2">
                <span className="w-8 h-[1px] bg-[#E8E3D9]"></span>
                BEGIN YOUR JOURNEY
                <span className="w-8 h-[1px] bg-[#E8E3D9]"></span>
              </p>
            </div>
          ) : (
            <div>
              <button
                data-testid="google-login-btn"
                onClick={handleEmergentLogin}
                className="w-full btn-paper-accent text-base py-3.5 shadow-md group relative overflow-hidden"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  Continue with Google
                </span>
              </button>
              <p className="text-[10px] text-[#9B948B] mt-3 text-center uppercase tracking-widest opacity-60">
                Powered by Emergent Auth
              </p>
            </div>
          )}
        </div>

        {/* Footer/Version */}
        <div className="text-center animate-in fade-in duration-1000 delay-700">
          <p className="text-[10px] text-[#A68A64]/60 uppercase tracking-widest">v1.0 • Crafted for Readers</p>
        </div>

        {/* Setup Instructions (Dev Only) */}
        {!USE_GOOGLE_OAUTH && (
          <div className="mt-4 p-4 bg-white/50 border border-[#E8E3D9] rounded-lg text-left backdrop-blur-sm animate-in fade-in duration-500 delay-1000 hidden md:block">
            <p className="text-xs text-[#6A645C] mb-1 font-bold">Dev Setup:</p>
            <p className="text-[10px] text-[#9B948B] font-mono leading-relaxed">
              To use your own Google OAuth, check <code>/app/MONGODB_GOOGLE_SETUP.md</code> and update <code>.env</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginWithGoogle;
