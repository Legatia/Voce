import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, Target, Zap, Award, Coins } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";

interface RewardsDisplayProps {
  compact?: boolean;
}

const RewardsDisplay = ({ compact = false }: RewardsDisplayProps) => {
  const {
    stats,
    getLevelProgress,
    getRecentRewards,
    getRewardsByType,
    initializeRewards,
  } = useRewards();

  React.useEffect(() => {
    initializeRewards();
  }, [initializeRewards]);

  const levelProgress = getLevelProgress();
  const recentRewards = getRecentRewards(5);
  const xpRewards = getRewardsByType("xp");
  const cryptoRewards = getRewardsByType("crypto");

  const getLevelColor = (level: number) => {
    if (level >= 8) return "text-purple-500";
    if (level >= 6) return "text-red-500";
    if (level >= 4) return "text-orange-500";
    if (level >= 2) return "text-blue-500";
    return "text-green-500";
  };

  const getLevelBadge = (level: number) => {
    if (level >= 8) return "Legendary";
    if (level >= 6) return "Expert";
    if (level >= 4) return "Advanced";
    if (level >= 2) return "Intermediate";
    return "Beginner";
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Level {stats.level}</span>
              <Badge variant="outline" className={getLevelColor(stats.level)}>
                {getLevelBadge(stats.level)}
              </Badge>
            </div>
            <Progress value={levelProgress.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.totalXP} XP</span>
              <span>{stats.xpToNextLevel} XP to next level</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-warning">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
            <div>
              <div className="text-sm font-medium">Total Earned</div>
              <div className="text-xs text-muted-foreground">All time</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{stats.totalCryptoEarned.toFixed(2)} APT</div>
              <div className="text-xs text-muted-foreground">{stats.totalXP} XP</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            Your Achievements
          </CardTitle>
          <CardDescription>
            Track your prediction performance and earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Level Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Level {stats.level}</h3>
                <p className="text-sm text-muted-foreground">
                  {getLevelBadge(stats.level)} Predictor
                </p>
              </div>
              <Badge variant="outline" className={`text-sm px-3 py-1 ${getLevelColor(stats.level)}`}>
                {stats.totalXP} XP
              </Badge>
            </div>
            <Progress value={levelProgress.progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Current: {stats.totalXP} XP</span>
              <span>Next Level: {levelProgress.nextLevelXP} XP</span>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.correctPredictions}/{stats.totalPredictions}
              </div>
              <div className="text-xs text-muted-foreground">Predictions</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.accuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.streak}
              </div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.highestStreak}
              </div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold">XP Earned</h4>
              </div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {stats.totalXP.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                From {xpRewards.length} rewards
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold">Crypto Earned</h4>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.totalCryptoEarned.toFixed(2)} APT
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                From {cryptoRewards.length} rewards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recent Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRewards.length > 0 ? (
            <div className="space-y-3">
              {recentRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reward.type === "xp" ? "bg-amber-100" : "bg-green-100"
                    }`}>
                      {reward.type === "xp" ? (
                        <Star className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Coins className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{reward.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reward.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      reward.type === "xp" ? "text-amber-600" : "text-green-600"
                    }`}>
                      {reward.type === "xp" ? "+" : ""}{reward.amount} {reward.type === "xp" ? "XP" : "APT"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {reward.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rewards yet. Start voting to earn XP and crypto!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsDisplay;