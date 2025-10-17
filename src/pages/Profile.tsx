import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Calendar, Coins, Zap, Award } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useRewards } from "@/hooks/useRewards";
import { useVoting } from "@/hooks/useVoting";
import EventCard from "@/components/EventCard";
import RewardsDisplay from "@/components/rewards/RewardsDisplay";
import { mockEvents } from "@/data/mockEvents";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("active");
  const { account, walletInfo, formatAddress } = useWallet();
  const { stats, getLevelProgress, initializeRewards } = useRewards();
  const { votes, getVotingStats, initializeVoting } = useVoting();

  // Initialize hooks on mount
  useEffect(() => {
    initializeRewards();
    initializeVoting();
  }, [initializeRewards, initializeVoting]);

  // User data from wallet and stats
  const user = {
    name: account ? "Voce Predictor" : "Guest User",
    username: account ? "@voce_predictor" : "@guest",
    avatar: account ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.accountAddress.toString()}` : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
    walletAddress: account ? formatAddress(walletInfo?.address || "", 8) : "Not Connected",
    joinDate: account ? "Today" : "Not Connected",
    totalXP: stats.totalXP,
    rank: Math.floor(Math.random() * 1000) + 1, // Mock rank
    totalBets: stats.totalPredictions,
    winRate: stats.accuracy,
    totalEarnings: `${stats.totalCryptoEarned.toFixed(2)} APT`
  };

  const levelProgress = getLevelProgress();

  // Get user's voting events
  const getUserEvents = () => {
    if (!account) return { active: [], history: [], created: [] };

    const votedEventIds = votes.map(vote => vote.eventId);
    const votedEvents = mockEvents.filter(event => votedEventIds.includes(event.id.toString()));

    return {
      active: votedEvents.slice(0, 2),
      history: votedEvents.slice(2, 4),
      created: mockEvents.slice(0, 2)
    };
  };

  const { active: activeBets, history: historyBets, created: createdEvents } = getUserEvents();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    Rank #{user.rank}
                  </Badge>
                  <Badge className="gap-1 bg-gradient-primary">
                    <Award className="w-3 h-3" />
                    Level {stats.level}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-1">{user.username}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{user.walletAddress}</span> • Joined {user.joinDate}
                </p>
                
                {/* Level Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Level {stats.level} Progress
                    </span>
                    <span className="font-medium">
                      {stats.totalXP.toLocaleString()} / {(stats.totalXP + stats.xpToNextLevel).toLocaleString()} XP
                    </span>
                  </div>
                  <Progress value={levelProgress.progress} className="h-2" />
                </div>
              </div>

              <Button variant="outline">Edit Profile</Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                  <Zap className="w-5 h-5 text-primary" />
                  {stats.totalXP.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                  <Coins className="w-5 h-5 text-success" />
                  {stats.totalCryptoEarned.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">APT Earned</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                  <Calendar className="w-5 h-5 text-primary" />
                  {stats.totalPredictions}
                </div>
                <p className="text-sm text-muted-foreground">Predictions</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {stats.accuracy.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                  <Zap className="w-5 h-5 text-warning" />
                  {stats.streak}
                </div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="active">Active Bets</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="created">Created Events</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeBets.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No active bets yet</p>
                  <Button className="mt-4" variant="outline">Browse Events</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {historyBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyBets.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No betting history yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <RewardsDisplay />
          </TabsContent>

          <TabsContent value="created" className="space-y-6">
            {createdEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdEvents.map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No events created yet</p>
                  <Button className="mt-4" variant="outline">Create Your First Event</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
