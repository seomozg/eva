import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Heart } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Create Your Virtual Companion</title>
        <meta name="description" content="Create your perfect AI companion. Design her personality, appearance, and more through natural conversation." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f0e14" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-lavender-mist/10 blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-blush/5 blur-[60px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-sm">
          {/* Decorative icon */}
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-lavender-mist/10 border border-primary/20 glow-rose">
            <Heart className="w-8 h-8 text-primary animate-pulse-soft" />
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl font-medium text-foreground mb-4 leading-tight">
            Find your <span className="text-gradient">perfect</span> companion
          </h1>

          <p className="text-muted-foreground font-body text-base mb-12 leading-relaxed">
            Create someone who truly understands you. Just talk, and she'll become exactly who you need.
          </p>

          {/* Auth buttons */}
          <div className="space-y-4">
            <Link
              to="/register"
              className="block w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-primary to-blush text-primary-foreground font-body font-medium text-lg shadow-lg glow-rose hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Get started
            </Link>

            <Link
              to="/login"
              className="block w-full py-4 px-8 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm text-foreground font-body font-medium text-lg hover:bg-primary/5 transition-all duration-300"
            >
              Sign in
            </Link>
          </div>

          {/* Subtle hint */}
          <p className="mt-6 text-xs text-muted-foreground/60">
            Everything happens through conversation
          </p>
        </div>
      </div>
    </>
  );
};

export default Landing;
