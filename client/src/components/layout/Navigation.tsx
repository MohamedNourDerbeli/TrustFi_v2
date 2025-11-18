// Navigation.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ConnectWalletButton from "../auth/ConnectWalletButton";
import { useProfile } from "../../hooks/useProfile";
import { AnimatePresence, motion } from "motion/react";

export const Navigation: React.FC = () => {
  const { isConnected, hasProfile, isAdmin, isIssuer, address, disconnect } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { profile } = useProfile();

  const initials = (name?: string) =>
    name ? name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() : "U";
  const truncate = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
    localStorage.setItem("tf-theme", "dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const navLinkClass = (path: string) => {
    const base = "px-3 py-2 rounded-xl font-medium transition-colors duration-200";
    return isActive(path)
      ? `${base} bg-white/15 text-white shadow-sm`
      : `${base} text-slate-200 hover:text-white hover:bg-white/10`;
  };

  const mobileNavLinkClass = (path: string) => {
    const base = "block px-4 py-3 rounded-xl font-medium transition-colors duration-200";
    return isActive(path)
      ? `${base} bg-white/15 text-white`
      : `${base} text-slate-200 hover:text-white hover:bg-white/10`;
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40"
      data-scrolled={isScrolled}
    >
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <div
          className={`${
            isScrolled
              ? "border-white/20 bg-slate-950/75 shadow-lg shadow-black/30"
              : "border-white/10 bg-slate-950/55"
          } mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 rounded-2xl border backdrop-blur-xl px-4 sm:px-6 lg:px-8 transition-all duration-300`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/TrustFi.svg"
              alt="TrustFi Logo"
              className="h-10 w-auto select-none transition-opacity group-hover:opacity-90"
              draggable={false}
            />
            <h1 className="text-xl font-bold text-white">TrustFi</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 text-sm">
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
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:bg-white/10"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-xs font-semibold">
                      {hasProfile ? initials(profile?.displayName) : initials("Wallet")}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white leading-none">
                      {hasProfile ? profile?.displayName || "User" : "Wallet Connected"}
                    </div>
                  </div>
                  <svg
                    className={`ml-1 w-4 h-4 text-slate-300 transition-transform ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                        transition={{ type: "spring", stiffness: 420, damping: 26 }}
                        className="absolute right-0 mt-3 w-72 rounded-xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/40 backdrop-blur-xl z-20 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 p-4">
                          {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-sm font-semibold">
                              {hasProfile ? initials(profile?.displayName) : initials("Wallet")}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {hasProfile ? profile?.displayName || "User" : "Wallet Connected"}
                            </div>
                            <div className="text-xs text-slate-300 font-mono">{truncate(address)}</div>
                          </div>
                        </div>
                        <div className="py-1">
                          {hasProfile ? (
                            <>
                              <Link
                                to="/dashboard"
                                className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                View Dashboard
                              </Link>
                              <Link
                                to="/profile/edit"
                                className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                Edit Profile
                              </Link>
                            </>
                          ) : (
                            <Link
                              to="/create-profile"
                              className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              Create Profile
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              disconnect();
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                          >
                            Disconnect
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <ConnectWalletButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {!isConnected && <ConnectWalletButton />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/85 py-4 backdrop-blur-xl">
            <div className="space-y-1">
              {isConnected && hasProfile && (
                <>
                  <Link to="/dashboard" className={mobileNavLinkClass("/dashboard")} onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/discover" className={mobileNavLinkClass("/discover")} onClick={() => setIsMobileMenuOpen(false)}>
                    Discover
                  </Link>
                  <Link to="/profile/edit" className={mobileNavLinkClass("/profile/edit")} onClick={() => setIsMobileMenuOpen(false)}>
                    Edit Profile
                  </Link>
                </>
              )}
              {isConnected && !hasProfile && (
                <>
                  <Link to="/create-profile" className={mobileNavLinkClass("/create-profile")} onClick={() => setIsMobileMenuOpen(false)}>
                    Create Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      disconnect();
                    }}
                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                  >
                    Disconnect
                  </button>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className={mobileNavLinkClass("/admin")} onClick={() => setIsMobileMenuOpen(false)}>
                  Admin Portal
                </Link>
              )}
              {isIssuer && (
                <Link to="/issuer" className={mobileNavLinkClass("/issuer")} onClick={() => setIsMobileMenuOpen(false)}>
                  Issuer Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
};
