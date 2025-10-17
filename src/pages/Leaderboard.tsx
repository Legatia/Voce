import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Award, Coins, Star } from "lucide-react";

const topPredictors = [
  {
    rank: 1,
    name: "CryptoProphet",
    xp: 45230,
    correctPredictions: 127,
    totalPredictions: 145,
    accuracy: 87.6,
    earnings: "2450 USDC",
    badge: "Diamond",
  },
  {
    rank: 2,
    name: "MarketMaven",
    xp: 38940,
    correctPredictions: 98,
    totalPredictions: 115,
    accuracy: 85.2,
    earnings: "1980 USDC",
    badge: "Platinum",
  },
  {
    rank: 3,
    name: "OracleKing",
    xp: 35670,
    correctPredictions: 112,
    totalPredictions: 134,
    accuracy: 83.6,
    earnings: "1760 USDC",
    badge: "Platinum",
  },
  {
    rank: 4,
    name: "FutureSeer",
    xp: 32100,
    correctPredictions: 89,
    totalPredictions: 108,
    accuracy: 82.4,
    earnings: "1540 USDC",
    badge: "Gold",
  },
  {
    rank: 5,
    name: "VoteWizard",
    xp: 29800,
    correctPredictions: 95,
    totalPredictions: 118,
    accuracy: 80.5,
    earnings: "1420 USDC",
    badge: "Gold",
  },
  {
    rank: 6,
    name: "TrendSpotter",
    xp: 27650,
    correctPredictions: 76,
    totalPredictions: 96,
    accuracy: 79.2,
    earnings: "1290 USDC",
    badge: "Gold",
  },
  {
    rank: 7,
    name: "DataDriven",
    xp: 25300,
    correctPredictions: 82,
    totalPredictions: 105,
    accuracy: 78.1,
    earnings: "1150 USDC",
    badge: "Silver",
  },
  {
    rank: 8,
    name: "InsightMaster",
    xp: 23890,
    correctPredictions: 68,
    totalPredictions: 88,
    accuracy: 77.3,
    earnings: "1080 USDC",
    badge: "Silver",
  },
  {
    rank: 9,
    name: "PredictPro",
    xp: 22140,
    correctPredictions: 71,
    totalPredictions: 93,
    accuracy: 76.3,
    earnings: "989 USDC",
    badge: "Silver",
  },
  {
    rank: 10,
    name: "AnalystAce",
    xp: 20560,
    correctPredictions: 64,
    totalPredictions: 85,
    accuracy: 75.3,
    earnings: "895 USDC",
    badge: "Silver",
  },
];

const topCreators = [
  {
    rank: 1,
    name: "EventMaster",
    eventsCreated: 43,
    totalVotes: 187650,
    earnings: "3205 USDC",
  },
  {
    rank: 2,
    name: "QuestionCraft",
    eventsCreated: 38,
    totalVotes: 156320,
    earnings: "2867 USDC",
  },
  {
    rank: 3,
    name: "MarketMaker",
    eventsCreated: 35,
    totalVotes: 142180,
    earnings: "2521 USDC",
  },
];

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case "Diamond":
      return "bg-gradient-to-r from-cyan-400 to-blue-500 text-white";
    case "Platinum":
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    case "Gold":
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    case "Silver":
      return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Leaderboard</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Top predictors and event creators earning the most rewards
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-card border border-border rounded-xl p-6 text-center">
              <Trophy className="w-8 h-8 text-warning mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">1,247</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">45K+</div>
              <div className="text-sm text-muted-foreground">Active Predictors</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-xl p-6 text-center">
              <Coins className="w-8 h-8 text-success mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">$2.4M</div>
              <div className="text-sm text-muted-foreground">Total Rewards</div>
            </div>
            <div className="bg-gradient-card border border-border rounded-xl p-6 text-center">
              <Award className="w-8 h-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">87.2%</div>
              <div className="text-sm text-muted-foreground">Avg Accuracy</div>
            </div>
          </div>

          {/* Leaderboard Tabs */}
          <Tabs defaultValue="predictors" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm border border-border mb-8">
              <TabsTrigger value="predictors">Top Predictors</TabsTrigger>
              <TabsTrigger value="creators">Top Creators</TabsTrigger>
            </TabsList>

            <TabsContent value="predictors">
              {/* Top 3 Podium */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {topPredictors.slice(0, 3).map((predictor) => (
                  <div
                    key={predictor.rank}
                    className={`bg-gradient-card border rounded-xl p-6 text-center relative ${
                      predictor.rank === 1
                        ? "border-warning shadow-glow md:scale-105"
                        : "border-border"
                    }`}
                  >
                    {predictor.rank === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-glow">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4 mt-2">
                      <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary">
                        <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                          {predictor.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold mb-1">{predictor.name}</h3>
                      <Badge className={getBadgeColor(predictor.badge)}>
                        <Star className="w-3 h-3 mr-1" />
                        {predictor.badge}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">XP:</span>
                        <span className="font-semibold text-warning">{predictor.xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="font-semibold text-success">{predictor.accuracy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Earnings:</span>
                        <span className="font-semibold text-primary">{predictor.earnings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rest of Rankings */}
              <div className="bg-gradient-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Predictor</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">XP</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Predictions</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Accuracy</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPredictors.slice(3).map((predictor) => (
                        <tr
                          key={predictor.rank}
                          className="border-b border-border hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{predictor.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-muted">
                                  {predictor.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{predictor.name}</div>
                                <Badge variant="outline" className="text-xs">
                                  {predictor.badge}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-warning">
                              {predictor.xp.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {predictor.correctPredictions}/{predictor.totalPredictions}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-success">
                              {predictor.accuracy}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-primary">
                              {predictor.earnings}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creators">
              <div className="bg-gradient-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Creator</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Events Created</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Total Votes</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCreators.map((creator) => (
                        <tr
                          key={creator.rank}
                          className="border-b border-border hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{creator.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                  {creator.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-semibold">{creator.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-warning">
                              {creator.eventsCreated}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {creator.totalVotes.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-success">
                              {creator.earnings}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
