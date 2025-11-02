import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LiveStreamingStudio from '@/components/streaming/LiveStreamingStudio';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';
import VideoPlayer from '@/aptos/components/VideoPlayer';
import {
  Radio,
  Users,
  Eye,
  TrendingUp,
  Target,
  Trophy,
  Flame,
  Calendar,
  Zap,
  Sparkles,
  Play,
  Clock,
  DollarSign,
  Settings,
  Share2
} from 'lucide-react';

const LiveStreamingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'studio' | 'schedule' | 'rewards'>('discover');

  // Mock live streaming data
  const featuredStreams = [
    {
      id: '1',
      title: 'AI vs Human Chess Championship',
      description: 'Watch GPT-4 compete against a human grandmaster in real-time',
      category: 'ai_battle',
      thumbnail: '/api/placeholder/640/360',
      viewerCount: 1247,
      isLive: true,
      startTime: Date.now() - 300000,
      streamer: 'ChessMasterAI',
      rewardPool: 5000,
      participants: 892,
      predictionEnabled: true
    },
    {
      id: '2',
      title: 'Crypto Price Prediction Reveal',
      description: 'Live results of this week\'s cryptocurrency market predictions',
      category: 'prediction_reveal',
      thumbnail: '/api/placeholder/640/360',
      viewerCount: 856,
      isLive: true,
      startTime: Date.now() - 120000,
      streamer: 'CryptoOracle',
      rewardPool: 2500,
      participants: 445,
      predictionEnabled: false
    },
    {
      id: '3',
      title: 'Creator Show: Advanced Prediction Strategies',
      description: 'Learn insider tips from top prediction platform users',
      category: 'creator_show',
      thumbnail: '/api/placeholder/640/360',
      viewerCount: 423,
      isLive: true,
      startTime: Date.now() - 600000,
      streamer: 'PredictionGuru',
      rewardPool: 1500,
      participants: 234,
      predictionEnabled: true
    }
  ];

  const upcomingEvents = [
    {
      id: '4',
      title: 'AI Music Generation Battle',
      description: 'Watch two AI models compose and compete in real-time',
      category: 'ai_battle',
      startTime: Date.now() + 3600000, // 1 hour from now
      estimatedDuration: 90,
      streamer: 'MusicAI',
      rewardPool: 3000
    },
    {
      id: '5',
      title: 'Sports Prediction Tournament',
      description: 'Weekly sports prediction competition with live commentary',
      category: 'tournament',
      startTime: Date.now() + 7200000, // 2 hours from now
      estimatedDuration: 120,
      streamer: 'SportsBettingPro',
      rewardPool: 4000
    },
    {
      id: '6',
      title: 'Market Analysis Live',
      description: 'Real-time market analysis and prediction insights',
      category: 'creator_show',
      startTime: Date.now() + 10800000, // 3 hours from now
      estimatedDuration: 60,
      streamer: 'MarketWizard',
      rewardPool: 2000
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai_battle': return <Target className="w-4 h-4" />;
      case 'prediction_reveal': return <Trophy className="w-4 h-4" />;
      case 'creator_show': return <Users className="w-4 h-4" />;
      case 'tournament': return <Flame className="w-4 h-4" />;
      default: return <Radio className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai_battle': return 'bg-red-500';
      case 'prediction_reveal': return 'bg-blue-500';
      case 'creator_show': return 'bg-green-500';
      case 'tournament': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeUntil = (timestamp: number) => {
    const diff = timestamp - Date.now();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
  };

  const StreamCard: React.FC<any> = ({ stream, featured = false }) => (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${
      featured ? 'ring-2 ring-primary' : ''
    }`}>
      <div className="relative">
        {/* Thumbnail/Preview */}
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-700 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Radio className="w-12 h-12 text-white/50 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Live Preview</p>
            </div>
          </div>

          {/* Live Badge */}
          {stream.isLive && (
            <div className="absolute top-4 left-4">
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {getCategoryIcon(stream.category)}
              <span className="ml-1 capitalize">
                {stream.category.replace('_', ' ')}
              </span>
            </Badge>
          </div>

          {/* Viewer Count */}
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              <Eye className="w-3 h-3 mr-1" />
              {stream.viewerCount?.toLocaleString() || 0}
            </Badge>
          </div>

          {/* Reward Pool */}
          {stream.rewardPool && (
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-green-600 text-white">
                <DollarSign className="w-3 h-3 mr-1" />
                {stream.rewardPool.toLocaleString()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {stream.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary"></div>
              <span className="text-muted-foreground">{stream.streamer}</span>
            </div>

            {stream.participants && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{stream.participants}</span>
              </div>
            )}
          </div>

          {stream.predictionEnabled && (
            <div className="pt-2 border-t">
              <Button size="sm" className="w-full">
                <Target className="w-4 h-4 mr-2" />
                Place Prediction
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const UpcomingEventCard: React.FC<any> = ({ event }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-2 ${getCategoryColor(event.category)}`}></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(event.category)}
              <Badge variant="outline" className="text-xs">
                {event.category.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeUntil(event.startTime)}
              </Badge>
            </div>
            <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
            <p className="text-xs text-muted-foreground mb-2">
              {event.description}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {event.streamer} • {event.estimatedDuration}min
              </span>
              {event.rewardPool && (
                <span className="text-success font-semibold">
                  ${event.rewardPool.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline">
            <Calendar className="w-3 h-3 mr-1" />
            Remind
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6 space-y-8 pt-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Live Streaming Arena
            </h1>
            <Radio className="w-8 h-8 text-secondary animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch live events, place real-time predictions, and compete in streaming tournaments!
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <span className="font-semibold">{featuredStreams.filter(s => s.isLive).length}</span>
              <span className="text-muted-foreground">Live Now</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-secondary" />
              <span className="font-semibold">
                {featuredStreams.reduce((sum, s) => sum + (s.viewerCount || 0), 0).toLocaleString()}
              </span>
              <span className="text-muted-foreground">Watching</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              <span className="font-semibold">
                ${featuredStreams.reduce((sum, s) => sum + (s.rewardPool || 0), 0).toLocaleString()}
              </span>
              <span className="text-muted-foreground">In Prizes</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Featured Stream */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                Featured Live Stream
              </h2>
              <StreamCard stream={featuredStreams[0]} featured={true} />
            </div>

            {/* All Live Streams */}
            <div>
              <h2 className="text-2xl font-bold mb-4">All Live Streams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="studio" className="space-y-6">
            <Alert className="bg-primary/10 border-primary/20">
              <Radio className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary-foreground">
                <strong>Go Live!</strong> Start your own streaming channel, host prediction events, and earn from viewer engagement.
              </AlertDescription>
            </Alert>
            <LiveStreamingStudio />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <UpcomingEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Streaming Rewards & XP
              </h2>
              <Alert className="bg-success/10 border-success/20">
                <Zap className="h-4 w-4 text-success" />
                <AlertDescription className="text-success-foreground">
                  <strong>Double XP!</strong> Earn bonus XP for watching streams, placing predictions, and hosting your own events.
                </AlertDescription>
              </Alert>
              <GamificationDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveStreamingPage;