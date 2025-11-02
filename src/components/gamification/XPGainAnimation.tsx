import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, Star } from 'lucide-react';

interface XPGainAnimationProps {
  amount: number;
  source: string;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const XPGainAnimation: React.FC<XPGainAnimationProps> = ({
  amount,
  source,
  position = { x: 50, y: 50 },
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [floatY, setFloatY] = useState(0);

  useEffect(() => {
    // Start floating animation
    const floatInterval = setInterval(() => {
      setFloatY(prev => {
        if (prev >= 100) {
          clearInterval(floatInterval);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 300);
          return prev;
        }
        return prev + 2;
      });
    }, 20);

    return () => clearInterval(floatInterval);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-300"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -${floatY}%)`,
        opacity: Math.max(0, 1 - floatY / 100),
      }}
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
        <Zap className="w-4 h-4" />
        <span className="font-bold text-lg">+{amount} XP</span>
        {amount >= 50 && <Star className="w-4 h-4 text-yellow-300" />}
        {amount >= 100 && <TrendingUp className="w-4 h-4 text-green-300" />}
      </div>
      {source && (
        <div className="text-xs text-center text-white/80 mt-1">
          {source}
        </div>
      )}
    </div>
  );
};

// Hook to manage XP animations
export const useXPAnimations = () => {
  const [animations, setAnimations] = useState<Array<{
    id: string;
    amount: number;
    source: string;
    position?: { x: number; y: number };
  }>>([]);

  const showXPGain = (
    amount: number,
    source: string,
    position?: { x: number; y: number }
  ) => {
    const id = Date.now().toString() + Math.random();
    const newAnimation = { id, amount, source, position };

    setAnimations(prev => [...prev, newAnimation]);

    // Remove animation after it completes
    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a.id !== id));
    }, 2000);
  };

  const removeAnimation = (id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };

  return {
    showXPGain,
    removeAnimation,
    animations,
  };
};

export default XPGainAnimation;