import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SeasonalLeaderboard, LeaderboardEntry, useGamification } from '@/lib/gamification';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface SeasonalLeaderboardProps {
  compact?: boolean;
}

const SeasonalLeaderboard: React.FC<SeasonalLeaderboardProps> = ({ compact = false }) => {
  const { progress } = useGamification();
  const [selectedSeason, setSelectedSeason] = useState('current');
  const [leaderboardData, setLeaderboardData] = useState<SeasonalLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState<'xp' | 'accuracy' | 'streak'>('xp');

  // Mock leaderboard data - in production this would come from backend
  const generateMockLeaderboard = (): SeasonalLeaderboard => {
    const now = Date.now();
    const seasonStart = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const seasonEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    const mockEntries: LeaderboardEntry[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        username: 'CryptoOracle',
        xp: 15420,
        level: 42,
        accuracy: 87.5,
        badgeCount: 28,
        title: 'Oracle',
      },
      {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        username: 'TruthSeeker',
        xp: 14200,
        level: 38,
        accuracy: 82.3,
        badgeCount: 24,
        title: 'Prophet',
      },
      {
        address: '0x567890abcdef1234567890abcdef1234567890ab',
        username: 'PredictionMaster',
        xp: 13500,
        level: 36,
        accuracy: 91.2,
        badgeCount: 31,
        title: 'Visionary',
      },
      {
        address: '0x9012345678abcdef1234567890abcdef12345678',
        username: 'StreakKing',
        xp: 12800,
        level: 34,
        accuracy: 78.9,
        badgeCount: 19,
        title: 'Expert',
      },
      {
        address: '0x34567890abcdef1234567890abcdef1234567890',
        username: 'LuckyPredictor',
        xp: 11900,
        level: 32,
        accuracy: 85.6,
        badgeCount: 22,
        title: 'Analyst',
      },
    ];

    // Add current user if they have progress
    if (progress) {
      const userEntry: LeaderboardEntry = {
        address: '0xuser1234567890abcdef1234567890abcdef123456', // Mock user address
        username: 'You',
        xp: progress.seasonXP,
        level: progress.seasonLevel,
        accuracy: progress.accuracy,
        badgeCount: progress.badges.length,
        title: progress.title,
      };

      // Insert user at appropriate position
      let insertIndex = mockEntries.findIndex(entry => entry.xp < progress.seasonXP);
      if (insertIndex === -1) insertIndex = mockEntries.length;
      mockEntries.splice(insertIndex, 0, userEntry);
    }

    // Sort based on selected type
    const sortedEntries = [...mockEntries].sort((a, b) => {
      switch (leaderboardType) {
        case 'xp':
          return b.xp - a.xp;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'streak':
          return (b as any).streak - (a as any).streak;
        default:
          return b.xp - a.xp;
      }
    });

    return {
      season: 'Fall 2024',
      startDate: seasonStart,
      endDate: seasonEnd,
      rankings: sortedEntries,
      userRank: sortedEntries.findIndex(entry => entry.username === 'You') + 1,
    };
  };

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = generateMockLeaderboard();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [progress, leaderboardType]);

  // Get rank icon and styling
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: <Crown className="w-5 h-5" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          badge: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
        };
      case 2:
        return {
          icon: <Trophy className="w-5 h-5" />,
          color: 'text-gray-400',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          badge: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
        };
      case 3:
        return {
          icon: <Medal className="w-5 h-5" />,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          badge: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
        };
      default:
        return {
          icon: <span className="font-bold text-lg">{rank}</span>,
          color: 'text-muted-foreground',
          bg: 'bg-transparent',
          border: 'border-transparent',
          badge: 'bg-muted text-muted-foreground'
        };
    }
  };

  // Get change indicator
  const getChangeIndicator = (rank: number) => {
    // Mock change data
    const changes: Record<number, 'up' | 'down' | 'same'> = {
      1: 'up',
      2: 'same',
      3: 'down',
      4: 'up',
      5: 'same',
    };

    const change = changes[rank] || 'same';

    switch (change) {
      case 'up':
        return <ChevronUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ChevronDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // Leaderboard entry component
  const LeaderboardEntryRow: React.FC<{ entry: LeaderboardEntry; rank: number; isUser?: boolean }> = ({
    entry,
    rank,
    isUser = false
  }) => {
    const rankDisplay = getRankDisplay(rank);

    return (
      <div className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        isUser ? rankDisplay.border + ' bg-blue-50 ring-2 ring-blue-400 ring-opacity-50' : 'border-border'
      }`}>
        <div className={`w-12 h-12 rounded-lg ${rankDisplay.bg} ${isUser ? rankDisplay.border : ''} flex items-center justify-center ${rankDisplay.color}`}>
          {rankDisplay.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">
              {entry.username}
            </h3>
            {isUser && (
              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                YOU
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {getChangeIndicator(rank)}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="capitalize">{entry.title}</span>
            <span>Level {entry.level}</span>
            <span>{entry.badgeCount} badges</span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold text-lg">
            {leaderboardType === 'xp' && entry.xp.toLocaleString() + ' XP'}
            {leaderboardType === 'accuracy' && entry.accuracy.toFixed(1) + '%'}
            {leaderboardType === 'streak' && (entry as any).streak + ' 🔥'}
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {leaderboardType}
          </div>
        </div>
      </div>
    );
  };

  // Compact view
  if (compact) {
    if (!leaderboardData || !progress) return null;

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold">Season Leaderboard</h3>
            </div>
            {leaderboardData.userRank && (
              <Badge variant="secondary">#{leaderboardData.userRank}</Badge>
            )}
          </div>

          <div className="space-y-2">
            {leaderboardData.rankings.slice(0, 3).map((entry, index) => (
              <div key={entry.address} className="flex items-center gap-2 text-sm">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {index + 1}
                </div>
                <span className="flex-1 truncate">{entry.username}</span>
                <span className="font-semibold">
                  {leaderboardType === 'xp' ? entry.xp.toLocaleString() :
                   leaderboardType === 'accuracy' ? entry.accuracy.toFixed(1) + '%' :
                   '0'}
                </span>
              </div>
            ))}
          </div>

          {leaderboardData.userRank && leaderboardData.userRank > 3 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                <div className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  {leaderboardData.userRank}
                </div>
                <span className="flex-1 font-semibold">You</span>
                <span className="font-bold text-blue-600">
                  {leaderboardType === 'xp' ? progress.seasonXP.toLocaleString() :
                   leaderboardType === 'accuracy' ? progress.accuracy.toFixed(1) + '%' :
                   '0'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Seasonal Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            {leaderboardData && (
              <div className="text-sm text-muted-foreground">
                {leaderboardData.season}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-muted-foreground">Loading leaderboard...</span>
          </div>
        ) : !leaderboardData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Leaderboard data not available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Season Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Season</div>
                  <div className="font-semibold">{leaderboardData.season}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Participants</div>
                  <div className="font-semibold">{leaderboardData.rankings.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Your Rank</div>
                  <div className="font-semibold text-blue-600">
                    {leaderboardData.userRank ? `#${leaderboardData.userRank}` : 'Not ranked'}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Type Selector */}
            <Tabs value={leaderboardType} onValueChange={(value) => setLeaderboardType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="xp" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  XP Leaderboard
                </TabsTrigger>
                <TabsTrigger value="accuracy" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Accuracy
                </TabsTrigger>
                <TabsTrigger value="streak" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Best Streak
                </TabsTrigger>
              </TabsList>

              <TabsContent value="xp" className="mt-6">
                <div className="space-y-3">
                  {leaderboardData.rankings.map((entry, index) => (
                    <LeaderboardEntryRow
                      key={entry.address}
                      entry={entry}
                      rank={index + 1}
                      isUser={entry.username === 'You'}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="accuracy" className="mt-6">
                <div className="space-y-3">
                  {[...leaderboardData.rankings]
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .map((entry, index) => (
                      <LeaderboardEntryRow
                        key={entry.address}
                        entry={entry}
                        rank={index + 1}
                        isUser={entry.username === 'You'}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="streak" className="mt-6">
                <div className="space-y-3">
                  {[...leaderboardData.rankings]
                    .sort((a, b) => (b as any).streak - (a as any).streak)
                    .map((entry, index) => (
                      <LeaderboardEntryRow
                        key={entry.address}
                        entry={{...entry, streak: Math.floor(Math.random() * 30) + 1}} // Mock streak data
                        rank={index + 1}
                        isUser={entry.username === 'You'}
                      />
                    ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Season Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Season Progress</span>
                <span className="text-muted-foreground">
                  {format(new Date(leaderboardData.startDate), 'MMM dd')} - {format(new Date(leaderboardData.endDate), 'MMM dd')}
                </span>
              </div>
              <Progress value={65} className="h-2" />
              <div className="text-center text-xs text-muted-foreground">
                Season ends in {Math.ceil((leaderboardData.endDate - Date.now()) / (24 * 60 * 60 * 1000))} days
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeasonalLeaderboard;