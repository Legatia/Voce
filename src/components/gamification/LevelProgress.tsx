import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserProgress } from '@/lib/gamification';
import { TrendingUp, Star, Zap, Crown } from 'lucide-react';

interface LevelProgressProps {
  progress: UserProgress;
  showDetails?: boolean;
  compact?: boolean;
}

const LevelProgress: React.FC<LevelProgressProps> = ({
  progress,
  showDetails = false,
  compact = false,
}) => {
  if (!progress) return null;

  const getRarityColor = (level: number) => {
    if (level >= 75) return 'bg-gradient-to-r from-yellow-400 to-amber-600';
    if (level >= 50) return 'bg-gradient-to-r from-purple-400 to-purple-600';
    if (level >= 35) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (level >= 25) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (level >= 15) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-gray-400 to-gray-600';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 75) return <Crown className="w-4 h-4" />;
    if (level >= 50) return <Star className="w-4 h-4" />;
    if (level >= 25) return <Zap className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 7) return 'text-orange-500';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-gray-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <div className={`w-12 h-12 rounded-full ${getRarityColor(progress.level)} flex items-center justify-center text-white font-bold`}>
          {getLevelIcon(progress.level)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{progress.title}</span>
            <Badge variant="secondary" className="text-xs">
              Lv. {progress.level}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.xp.toLocaleString()} XP
          </div>
        </div>
        {progress.streak > 0 && (
          <div className={`flex items-center gap-1 ${getStreakColor(progress.streak)}`}>
            <span className="text-2xl">🔥</span>
            <span className="font-bold">{progress.streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full ${getRarityColor(progress.level)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
              {getLevelIcon(progress.level)}
            </div>
            <div>
              <h3 className="text-lg font-bold">{progress.title}</h3>
              <p className="text-sm text-muted-foreground">Level {progress.level}</p>
            </div>
          </div>

          {progress.streak > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStreakColor(progress.streak)} bg-muted/50`}>
              <span className="text-xl">🔥</span>
              <div>
                <div className="font-bold">{progress.streak}</div>
                <div className="text-xs">Streak</div>
              </div>
            </div>
          )}
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Level Progress</span>
            <span className="text-muted-foreground">
              {progress.currentLevelXP.toLocaleString()} / {progress.nextLevelXP.toLocaleString()} XP
            </span>
          </div>
          <Progress value={progress.levelProgress} className="h-3" />
          <div className="text-center text-xs text-muted-foreground">
            {Math.floor(progress.levelProgress)}% to next level
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.xp.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.totalVotes}
              </div>
              <div className="text-xs text-muted-foreground">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.accuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progress.badges.length}
              </div>
              <div className="text-xs text-muted-foreground">Badges</div>
            </div>
          </div>
        )}

        {/* Best Streak Display */}
        {progress.bestStreak > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Best Streak:</span>
              <span className="font-bold text-orange-500">{progress.bestStreak} 🔥</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LevelProgress;