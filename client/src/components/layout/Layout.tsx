import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to home when user disconnects (except for public routes)
  useEffect(() => {
    const publicRoutes = ['/', '/claim', '/create-profile'];
    const isPublicRoute = publicRoutes.some(route => location.pathname === route);

    // If user disconnects and is not on a public route, redirect to home
    if (!isConnected && !isPublicRoute) {
      navigate('/', { replace: true });
    }
  }, [isConnected, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
