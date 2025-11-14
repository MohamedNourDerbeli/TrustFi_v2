import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { WalletConnect } from "../auth/WalletConnect";

export const Navigation: React.FC = () => {
  const { isConnected, hasProfile, isAdmin, isIssuer, address } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TrustFi</h1>
            </div>
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
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {address?.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm text-gray-500">Connected as</p>
                        <p className="text-sm font-mono text-gray-900 truncate">
                          {address}
                        </p>
                      </div>
                      <Link
                        to={`/profile/${address}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Edit Profile
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            <WalletConnect />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <WalletConnect />
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
                    to={`/profile/${address}`}
                    className={mobileNavLinkClass(`/profile/${address}`)}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    View Profile
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

              {isConnected && address && (
                <div className="px-4 py-3 mt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Connected as</p>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {address}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
