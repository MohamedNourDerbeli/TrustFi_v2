/**
 * CelebrationAnimation - Animated celebration effect for successful claims
 * Shows confetti or particle effects based on rarity tier
 */

import { useEffect, useState } from 'react';
import { RarityTier } from '@/types/collectible';
import { Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CelebrationAnimationProps {
  rarity: RarityTier;
  duration?: number;
}

export function CelebrationAnimation({
  rarity,
  duration = 3000,
}: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate random particles
    const particleCount = rarity >= RarityTier.EPIC ? 30 : rarity >= RarityTier.RARE ? 20 : 15;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 500,
    }));
    setParticles(newParticles);

    // Hide animation after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [rarity, duration]);

  if (!isVisible) return null;

  // Rarity-based colors
  const getParticleColor = () => {
    switch (rarity) {
      case RarityTier.LEGENDARY:
        return 'text-amber-500';
      case RarityTier.EPIC:
        return 'text-purple-500';
      case RarityTier.RARE:
        return 'text-blue-500';
      case RarityTier.UNCOMMON:
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const particleColor = getParticleColor();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-celebration-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
          }}
        >
          {rarity >= RarityTier.EPIC ? (
            <Star className={cn('w-6 h-6', particleColor)} fill="currentColor" />
          ) : (
            <Sparkles className={cn('w-5 h-5', particleColor)} />
          )}
        </div>
      ))}

      {/* Center burst effect for legendary */}
      {rarity === RarityTier.LEGENDARY && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-celebration-burst">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 opacity-50 blur-3xl" />
          </div>
        </div>
      )}

      {/* Confetti effect */}
      <div className="absolute inset-0 animate-celebration-confetti">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: [
                '#ef4444',
                '#f59e0b',
                '#10b981',
                '#3b82f6',
                '#8b5cf6',
                '#ec4899',
              ][Math.floor(Math.random() * 6)],
              animationDelay: `${Math.random() * 1000}ms`,
              animationDuration: `${2000 + Math.random() * 1000}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
