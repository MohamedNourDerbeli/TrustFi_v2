import { Link, useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Shield, Sparkles, Crown, Award, User as UserIcon } from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBadge from '@/components/collectibles/NotificationBadge';
import { useCollectibleNotifications } from '@/hooks/useCollectibleNotifications';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  // Determine user role for badge display
  const getUserRole = () => {
    if (!address) return null;
    if (userProfile?.isAdmin) return { label: 'Admin', icon: Crown, variant: 'destructive' as const };
    if (userProfile?.isIssuer) return { label: 'Issuer', icon: Award, variant: 'default' as const };
    return { label: 'User', icon: UserIcon, variant: 'secondary' as const };
  };

  const userRole = getUserRole();

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
    {
      href: '/debug/errors',
      label: 'Error Dashboard',
      show: userProfile?.isAdmin,
    },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/95 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-200 cursor-pointer group">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
                <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                TrustFi
              </span>
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
                      'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer inline-block',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'hover:bg-muted/80 hover:scale-105'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-foreground rounded-full" />
                    )}
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
                      'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer inline-block',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted/80'
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {address && <NotificationBadge />}
            {userRole && (
              <Badge 
                variant={userRole.variant}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shadow-sm"
              >
                <userRole.icon className="w-3.5 h-3.5" />
                {userRole.label}
              </Badge>
            )}
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
