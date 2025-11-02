import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification } from '@/hooks/useGamification';
import LevelProgress from './LevelProgress';
import BadgesDisplay from './BadgesDisplay';
import QuestsPanel from './QuestsPanel';
import MysteryCrates from './MysteryCrates';
import {
  Trophy,
  Target,
  Package,
  Star,
  TrendingUp,
  Flame,
  Award,
  BarChart3,
  Calendar,
  Zap,
  Crown,
  Settings
} from 'lucide-react';

interface GamificationDashboardProps {
  compact?: boolean;
  defaultTab?: string;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  compact = false,
  defaultTab = 'overview'
}) => {
  const { progress, loading } = useGamification();
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your gamification data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">Gamification System</h3>
          <p>Connect your wallet to start earning XP, badges, and rewards!</p>
        </CardContent>
      </Card>
    );
  }

  // Compact view for sidebars or small spaces
  if (compact) {
    return (
      <div className="space-y-4">
        <LevelProgress progress={progress} compact={true} />
        <QuestsPanel compact={true} />
        <MysteryCrates compact={true} />
      </div>
    );
  }

  // Quick stats for overview
  const quickStats = [
    {
      label: 'Current Level',
      value: progress.level,
      icon: <Star className="w-4 h-4" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Total XP',
      value: progress.xp.toLocaleString(),
      icon: <Zap className="w-4 h-4" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Current Streak',
      value: `${progress.streak} 🔥`,
      icon: <Flame className="w-4 h-4" />,
      color: progress.streak >= 3 ? 'text-orange-600' : 'text-gray-600',
      bg: progress.streak >= 3 ? 'bg-orange-50' : 'bg-gray-50'
    },
    {
      label: 'Accuracy',
      value: `${progress.accuracy.toFixed(1)}%`,
      icon: <Target className="w-4 h-4" />,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Badges Earned',
      value: progress.badges.length,
      icon: <Award className="w-4 h-4" />,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      label: 'Total Votes',
      value: progress.totalVotes,
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Gamification Profile
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {progress.title}
              </Badge>
              {progress.streak >= 7 && (
                <Badge className="bg-orange-500 text-white text-xs">
                  🔥 {progress.streak} Day Streak
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LevelProgress progress={progress} showDetails={true} />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className={`text-center p-3 rounded-lg ${stat.bg}`}
              >
                <div className={`flex items-center justify-center gap-1 mb-1 ${stat.color}`}>
                  {stat.icon}
                  <span className="text-xs font-semibold">{stat.label}</span>
                </div>
                <div className={`text-lg font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quests
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Crates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Level</span>
                    <span className="font-bold">{progress.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>XP to Next Level</span>
                    <span className="font-bold">
                      {progress.nextLevelXP - progress.currentLevelXP} XP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total XP Earned</span>
                    <span className="font-bold">{progress.xp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak</span>
                    <span className="font-bold">{progress.bestStreak} 🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Badges Earned</span>
                    <span className="font-bold">{progress.badges.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Predictions</span>
                    <span className="font-bold">{progress.totalVotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correct Predictions</span>
                    <span className="font-bold">{progress.correctPredictions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy Rate</span>
                    <span className="font-bold">{progress.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {progress.streak}
                  </div>
                  <div className="text-sm text-blue-700">Current Streak</div>
                  <div className="text-xs text-blue-600">Keep it going!</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {progress.seasonXP.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Season XP</div>
                  <div className="text-xs text-green-600">Season progress</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {progress.unlockedFeatures.length}
                  </div>
                  <div className="text-sm text-purple-700">Features Unlocked</div>
                  <div className="text-xs text-purple-600">New abilities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="space-y-6">
          <QuestsPanel compact={false} />
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <BadgesDisplay badges={progress.badges} compact={false} showCount={true} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <MysteryCrates compact={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;