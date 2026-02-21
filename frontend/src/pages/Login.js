import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

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

const Login = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

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

  // Rotate quotes every 6 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setVisible(true);
      }, 500); // fade-out duration
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const quote = QUOTES[quoteIndex];

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

          {/* Dynamic Quote */}
          <div className="mb-6 md:mb-8 min-h-[80px] flex items-center justify-center">
            <div
              style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 500ms ease-in-out',
              }}
            >
              <p
                className="text-[#2C2A27] text-sm md:text-base leading-relaxed italic"
                style={{ fontFamily: 'Lora, serif' }}
              >
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-[#9B948B] text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                — {quote.author}
              </p>
            </div>
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