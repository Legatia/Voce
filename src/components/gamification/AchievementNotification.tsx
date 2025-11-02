import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Flame,
  Award,
  TrendingUp,
  X,
  Sparkles
} from 'lucide-react';

interface AchievementNotificationProps {
  achievement: {
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward?: number;
  };
  isVisible: boolean;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setAnimateIn(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setAnimateIn(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'bg-gradient-to-r from-yellow-400 to-amber-600',
          border: 'border-yellow-400 shadow-lg shadow-yellow-400/50',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'epic':
        return {
          bg: 'bg-gradient-to-r from-purple-400 to-purple-600',
          border: 'border-purple-400 shadow-lg shadow-purple-400/50',
          text: 'text-purple-900',
          badge: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      case 'rare':
        return {
          bg: 'bg-gradient-to-r from-blue-400 to-blue-600',
          border: 'border-blue-400 shadow-lg shadow-blue-400/50',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-600',
          border: 'border-gray-400 shadow-md shadow-gray-400/30',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const rarityStyles = getRarityStyles(achievement.rarity);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      animateIn ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className={`w-80 border-2 ${rarityStyles.border} overflow-hidden animate-pulse`}>
        <CardContent className="p-0">
          {/* Header with gradient background */}
          <div className={`${rarityStyles.bg} text-white p-4 relative overflow-hidden`}>
            {/* Animated sparkles */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-3 h-3 text-white/60 animate-pulse"
                  style={{
                    left: `${20 + (i * 15)}%`,
                    top: `${10 + (i % 2) * 60}%`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
                  {achievement.icon}
                </div>
                <div>
                  <div className="font-bold text-lg">Achievement Unlocked!</div>
                  <Badge className={`${rarityStyles.badge} mt-1`}>
                    {achievement.rarity}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 bg-white">
            <h3 className="font-bold text-lg mb-2 text-gray-900">
              {achievement.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {achievement.description}
            </p>

            {achievement.xpReward && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">
                  +{achievement.xpReward} XP Reward
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-center">
              <Button
                size="sm"
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                Awesome!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to manage achievement notifications
export const useAchievementNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    achievement: any;
    isVisible: boolean;
  }>>([]);

  const showNotification = (achievement: any) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      achievement,
      isVisible: true,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Remove notification after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isVisible: false } : n
      )
    );
  };

  return {
    showNotification,
    hideNotification,
    notifications,
  };
};

export default AchievementNotification;