import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { WalletConnect } from "../auth/WalletConnect";
import ThemeTogglerButton from "../animate-ui/buttons/ThemeTogglerButton";
import { useProfile } from "../../hooks/useProfile";
import { AnimatePresence, motion } from "motion/react";

export const Navigation: React.FC = () => {
  const { isConnected, hasProfile, isAdmin, isIssuer, address, disconnect } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('tf-theme') || 'light');
  const { profile } = useProfile();

  const initials = (name?: string) => name ? name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'U';
  const truncate = (addr?: string) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : '';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tf-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navLinkClass = (path: string) => {
    const base = "px-3 py-2 rounded-lg font-medium transition-colors";
    return isActive(path)
      ? `${base} bg-blue-100 text-blue-700`
      : `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100`;
  };

  const mobileNavLinkClass = (path: string) => {
    const base = "block px-4 py-3 rounded-lg font-medium transition-colors";
    return isActive(path)
      ? `${base} bg-blue-100 text-blue-700`
      : `${base} text-gray-700 hover:text-gray-900 hover:bg-gray-100`;
  };

  return (
    <nav className="relative z-20 bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/TrustFi.svg"
              alt="TrustFi Logo"
              className="h-10 w-auto select-none transition-opacity group-hover:opacity-90"
              draggable={false}
            />
            <h1 className="text-xl font-bold text-gray-900">TrustFi</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isConnected && hasProfile && (
              <>
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link to="/discover" className={navLinkClass("/discover")}>
                  Discover
                </Link>
              </>
            )}

            {isAdmin && (
              <Link to="/admin" className={navLinkClass("/admin")}>
                Admin Portal
              </Link>
            )}

            {isIssuer && (
              <Link to="/issuer" className={navLinkClass("/issuer")}>
                Issuer Portal
              </Link>
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && hasProfile && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-xs font-semibold">
                      {initials(profile?.displayName)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 leading-none">
                      {profile?.displayName || 'User'}
                    </div>
                  </div>
                  <svg
                    className={`ml-1 w-4 h-4 text-gray-600 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden"
                      >
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                          {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-sm font-semibold">
                              {initials(profile?.displayName)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{profile?.displayName || 'User'}</div>
                            <div className="text-xs text-gray-500 font-mono">{truncate(address)}</div>
                          </div>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            View Dashboard
                          </Link>
                          <Link
                            to="/profile/edit"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            Edit Profile
                          </Link>
                          <button
                            onClick={() => { setIsProfileDropdownOpen(false); disconnect(); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <ThemeTogglerButton variant="ghost" />
            {!isConnected && <WalletConnect />}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {!isConnected && <WalletConnect />}
            <ThemeTogglerButton variant="ghost" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              {isConnected && hasProfile && (
                <>
                  <Link
                    to="/dashboard"
                    className={mobileNavLinkClass("/dashboard")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/discover"
                    className={mobileNavLinkClass("/discover")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Discover
                  </Link>
                  <Link
                    to="/profile/edit"
                    className={mobileNavLinkClass("/profile/edit")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Edit Profile
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={mobileNavLinkClass("/admin")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Portal
                </Link>
              )}

              {isIssuer && (
                <Link
                  to="/issuer"
                  className={mobileNavLinkClass("/issuer")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Issuer Portal
                </Link>
              )}

              {/* Removed wallet address display in mobile menu when connected */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
