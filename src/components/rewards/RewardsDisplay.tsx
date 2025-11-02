import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Star, TrendingUp, Target, Zap, Award, Coins, Database, RefreshCw, CheckCircle, AlertCircle, Flame, Gift, Crown, Flag } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useGamification } from "@/hooks/useGamification";

interface RewardsDisplayProps {
  compact?: boolean;
}

const RewardsDisplay = ({ compact = false }: RewardsDisplayProps) => {
  const {
    stats,
    getLevelProgress,
    getRecentRewards,
    getRewardsByType,
    getOnChainRewards,
    initializeRewards,
    syncToOnChain,
    useOnChain,
    onChainData,
    isSyncing,
    error,
  } = useRewards();

  const { progress, dailyQuests, weeklyQuests, completeQuest } = useGamification();

  React.useEffect(() => {
    initializeRewards();
  }, [initializeRewards]);

  const levelProgress = getLevelProgress();
  const recentRewards = getRecentRewards(5);
  const xpRewards = getRewardsByType("xp");
  const cryptoRewards = getRewardsByType("crypto");
  const onChainRewards = getOnChainRewards();

  // Demo achievements data
  const achievements = [
    { title: 'First Vote', description: 'Cast your first prediction', icon: '👣', unlocked: stats.totalPredictions > 0 },
    { title: 'Hot Streak', description: '3 correct predictions in a row', icon: '🔥', unlocked: stats.streak >= 3 },
    { title: 'Level Up', description: 'Reach level 5', icon: '⭐', unlocked: stats.level >= 5 },
    { title: 'XP Master', description: 'Earn 1000 XP', icon: '💎', unlocked: stats.totalXP >= 1000 },
    { title: 'Perfect Accuracy', description: '100% accuracy with 10+ predictions', icon: '🎯', unlocked: stats.accuracy === 100 && stats.totalPredictions >= 10 },
    { title: 'Crypto King', description: 'Earn 10 APT', icon: '👑', unlocked: stats.totalCryptoEarned >= 10 },
    { title: 'Persistent', description: 'Cast 50 predictions', icon: '📈', unlocked: stats.totalPredictions >= 50 },
    { title: 'Streak Master', description: 'Achieve 10 day streak', icon: '🏆', unlocked: stats.highestStreak >= 10 },
  ];

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

  // Sync handler
  const handleSyncToChain = async () => {
    try {
      await syncToOnChain();
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Your Progress
            </div>
            {useOnChain && (
              <div className="flex items-center gap-1">
                {onChainData ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Database className="w-4 h-4" />
                    <CheckCircle className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Database className="w-4 h-4" />
                    <AlertCircle className="w-3 h-3" />
                  </div>
                )}
              </div>
            )}
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
      {/* On-Chain Status */}
      {useOnChain && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                On-Chain Status
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncToChain}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync to Chain'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {onChainData ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Data On-Chain</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Local Only</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isSyncing ? 'Syncing' : 'Ready'}
                </span>
              </div>
            </div>

            {onChainData && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>Chain XP: {onChainData.xp.toLocaleString()}</div>
                  <div>Chain Level: {onChainData.level}</div>
                  <div>Chain Coins: {onChainData.totalEarnedCoins.toFixed(2)}</div>
                  <div>Last Updated: {new Date(onChainData.lastUpdated * 1000).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {onChainRewards.length} of {recentRewards.length} rewards stored on-chain
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Rewards with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-warning" />
                Your Progress
                {useOnChain && onChainData && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Database className="w-3 h-3 mr-1" />
                    On-Chain
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Track your prediction performance and earnings
                {useOnChain && " (stored on-chain with dynamic fields)"}
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
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-warning" />
                Achievement Showcase
              </CardTitle>
              <CardDescription>
                Unlock achievements by reaching milestones and completing challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden transition-all duration-300 ${
                      achievement.unlocked
                        ? 'border-green-200 bg-green-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                          achievement.unlocked
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked && (
                          <Badge className="bg-green-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Quest Progress
              </CardTitle>
              <CardDescription>
                Complete daily and weekly quests to earn XP and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Daily Quests
                  </h4>
                  <div className="space-y-3">
                    {dailyQuests.slice(0, 3).map((quest) => (
                      <div key={quest.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{quest.title}</span>
                          <Badge variant={quest.completed ? "default" : "outline"}>
                            {quest.completed ? "Completed" : `${quest.progress}/${quest.requirement}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                        <Progress value={(quest.progress / quest.requirement) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-purple-500" />
                    Weekly Quests
                  </h4>
                  <div className="space-y-3">
                    {weeklyQuests.slice(0, 3).map((quest) => (
                      <div key={quest.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{quest.title}</span>
                          <Badge variant={quest.completed ? "default" : "outline"}>
                            {quest.completed ? "Completed" : `${quest.progress}/${quest.requirement}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                        <Progress value={(quest.progress / quest.requirement) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
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
                        <div className="flex items-center gap-2 justify-end">
                          {reward.onChain && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                              <Database className="w-3 h-3 mr-1" />
                              Chain
                            </Badge>
                          )}
                          <p className={`font-bold ${
                            reward.type === "xp" ? "text-amber-600" : "text-green-600"
                          }`}>
                            {reward.type === "xp" ? "+" : ""}{reward.amount} {reward.type === "xp" ? "XP" : "APT"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardsDisplay;