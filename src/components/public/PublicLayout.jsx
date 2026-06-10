import { Link, useLocation } from 'react-router-dom';
import Logo from "../Logo";
import Footer from "../Footer";

export default function PublicLayout({ children, hideFooter = false, hideNav = false }) {
  const location = useLocation();
  const isDark = location.pathname === '/request-access'; // Some pages might want a different vibe, but we'll stick to mostly light/clean for now

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-theme-secondary selection:text-white">
      {/* Universal Premium Navigation */}
      {!hideNav && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
          <Link to="/" className="transform hover:scale-105 transition-transform">
            <Logo />
          </Link>
          
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-slate-600">
            <Link 
              to="/#features" 
              className="hover:text-theme-secondary transition-colors"
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className={`hover:text-theme-secondary transition-colors ${location.pathname === '/pricing' ? 'text-theme-secondary' : ''}`}
            >
              Pricing
            </Link>
            <Link 
              to="/explore" 
              className={`hover:text-theme-secondary transition-colors ${location.pathname === '/explore' ? 'text-theme-secondary' : ''}`}
            >
              Marketplace
            </Link>
            <Link 
              to="/login" 
              className="hover:text-theme-secondary transition-colors ml-4"
            >
              Login
            </Link>
            <Link 
              to="/request-access" 
              className="bg-theme-secondary text-white px-6 py-2.5 rounded-full hover:bg-theme-main transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </Link>
          </div>
          
          {/* Mobile menu button could go here in the future */}
        </div>
      </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>

      {/* Universal Premium Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}
