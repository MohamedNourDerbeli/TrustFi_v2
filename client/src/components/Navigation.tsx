import { Link, useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Shield } from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBadge from '@/components/collectibles/NotificationBadge';
import { useCollectibleNotifications } from '@/hooks/useCollectibleNotifications';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const [location] = useLocation();
  const { userProfile, address } = useWallet();
  const { offChainData } = useProfile();
  
  // Initialize collectible notifications
  useCollectibleNotifications();

  const profileUrl = offChainData?.username 
    ? `/${offChainData.username}` 
    : address 
    ? `/${address}` 
    : '/profile';

  const navLinks = [
    {
      href: '/search',
      label: 'Search',
      show: true, // Always show search
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      show: !!address, // Show if wallet connected
    },
    {
      href: profileUrl,
      label: 'Profile',
      show: !!address, // Show if wallet connected (profile auto-created)
    },
    {
      href: '/issuer',
      label: 'Issue Credentials',
      show: userProfile?.isIssuer,
    },
    {
      href: '/admin',
      label: 'Admin',
      show: userProfile?.isAdmin,
    },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">TrustFi</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (!link.show) return null;
              
              const isActive = location === link.href;
              
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer inline-block',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-1">
            {navLinks.map((link) => {
              if (!link.show) return null;
              
              const isActive = location === link.href;
              
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      'px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer inline-block',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {address && <NotificationBadge />}
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
