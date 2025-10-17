import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Trophy, TrendingUp, CheckCircle2, XCircle, Info, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useVoting } from "@/hooks/useVoting";
import VotingCard from "@/components/voting/VotingCard";
import CommitRevealVoting from "@/components/voting/CommitRevealVoting";
import { mockEvents } from "@/data/mockEvents";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected } = useWallet();
  const { castVote, hasVoted, getUserVote, initializeVoting } = useVoting();
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | null>(null);
  const [userVoted, setUserVoted] = useState(false);
  const [userVoteData, setUserVoteData] = useState<any>(null);

  // Find the event by ID
  const event = mockEvents.find((e) => e.id === Number(id));

  // Initialize voting hook
  useEffect(() => {
    initializeVoting();
  }, [initializeVoting]);

  // Check if user has voted on this event
  useEffect(() => {
    if (event && id) {
      const voted = hasVoted(id);
      const voteData = getUserVote(id);
      setUserVoted(voted);
      setUserVoteData(voteData);
    }
  }, [event, id, hasVoted, getUserVote]);

  // If event not found, redirect to 404
  if (!event) {
    navigate("/404");
    return null;
  }

  const handleVote = async (eventId: string, optionId: string, stake: number) => {
    try {
      const txHash = await castVote(eventId, optionId, stake);

      toast({
        title: "Vote Cast Successfully!",
        description: `Your vote has been recorded on the blockchain. Transaction: ${txHash.substring(0, 10)}...`,
      });

      // Update local state
      setUserVoted(true);
      const voteData = getUserVote(eventId);
      setUserVoteData(voteData);
    } catch (error) {
      toast({
        title: "Vote Failed",
        description: error instanceof Error ? error.message : "Failed to cast vote",
        variant: "destructive",
      });
    }
  };

  const handleCommit = async (eventId: string, commitment: string, stake: number) => {
    // Mock commit functionality
    toast({
      title: "Commitment Successful!",
      description: "Your vote has been committed. Save your salt for the reveal phase.",
    });
  };

  const handleReveal = async (eventId: string, optionId: string, salt: string) => {
    // Mock reveal functionality
    toast({
      title: "Vote Revealed!",
      description: "Your vote has been successfully revealed.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-6">
            <span>Markets</span>
            <span className="mx-2">/</span>
            <span>{event.category}</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Event #{event.id}</span>
          </div>

          {/* Header */}
          <div className="bg-gradient-card border border-border rounded-xl p-8 mb-8 shadow-card">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline" className="bg-accent/10 border-accent">
                {event.category}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10 border-secondary">
                {event.region}
              </Badge>
              {event.isVotingClosed && (
                <Badge variant="outline" className="bg-destructive/10 border-destructive">
                  <Lock className="w-3 h-3 mr-1" />
                  Voting Closed
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              {event.title}
            </h1>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning" />
                <div>
                  <div className="text-xs text-muted-foreground">Voting Ends</div>
                  <div className="font-semibold">{event.votingDeadline}</div>
                </div>
              </div>

              {event.resultDeadline && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-success" />
                  <div>
                    <div className="text-xs text-muted-foreground">Est. Result Date</div>
                    <div className="font-semibold">{event.resultDeadline}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-secondary" />
                <div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                  <div className="font-semibold">{event.participants.toLocaleString()}</div>
                </div>
              </div>

              {event.isVotingClosed && (
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Rewards</div>
                    <div className="font-semibold">{event.xpReward} XP + {event.cryptoReward}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voting Section */}
          <div className="mb-8">
            <Tabs defaultValue="simple" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="simple">Simple Voting</TabsTrigger>
                <TabsTrigger value="commit-reveal">Commit-Reveal</TabsTrigger>
              </TabsList>

              <TabsContent value="simple">
                <VotingCard
                  event={{
                    id: event.id.toString(),
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    deadline: new Date(event.votingDeadline).toISOString(),
                    totalPool: event.participants * 10, // Mock pool size
                    participants: event.participants,
                    options: [
                      {
                        id: "yes",
                        text: "YES - This event will happen",
                        votes: Math.floor(event.participants * 0.6),
                        percentage: event.isVotingClosed ? 60 : 0 // Hidden until voting closes
                      },
                      {
                        id: "no",
                        text: "NO - This event will NOT happen",
                        votes: Math.floor(event.participants * 0.4),
                        percentage: event.isVotingClosed ? 40 : 0 // Hidden until voting closes
                      }
                    ],
                    status: event.isVotingClosed ? "resolved" : "active",
                    resolution: event.isVotingClosed ? "YES" : undefined,
                    userVote: userVoteData?.optionId,
                    hasVoted: userVoted
                  }}
                  onVote={handleVote}
                  showResults={event.isVotingClosed}
                />
              </TabsContent>

              <TabsContent value="commit-reveal">
                <CommitRevealVoting
                  event={{
                    id: event.id.toString(),
                    title: event.title,
                    deadline: new Date(event.votingDeadline).toISOString(),
                    revealDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours after voting
                    options: [
                      { id: "yes", text: "YES - This event will happen" },
                      { id: "no", text: "NO - This event will NOT happen" }
                    ],
                    commitPhase: !event.isVotingClosed,
                    revealPhase: event.isVotingClosed
                  }}
                  onCommit={handleCommit}
                  onReveal={handleReveal}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Info Tabs */}
          <Tabs defaultValue="details" className="mb-8">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-border w-full">
              <TabsTrigger value="details" className="flex-1">Event Details</TabsTrigger>
              <TabsTrigger value="resolution" className="flex-1">Resolution</TabsTrigger>
              <TabsTrigger value="rewards" className="flex-1">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="bg-gradient-card border border-border rounded-xl p-8 mt-6">
              <h3 className="text-xl font-bold mb-4">Description</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {event.description}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Created By</h4>
                  <p className="text-muted-foreground">{event.creator}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Created On</h4>
                  <p className="text-muted-foreground">{event.createdAt}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resolution" className="bg-gradient-card border border-border rounded-xl p-8 mt-6">
              <h3 className="text-xl font-bold mb-4">Resolution Criteria</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {event.resolutionCriteria}
              </p>

              <h4 className="font-semibold mb-2">Data Sources</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {event.dataSources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="rewards" className="bg-gradient-card border border-border rounded-xl p-8 mt-6">
              <h3 className="text-xl font-bold mb-6">Reward Structure</h3>

              {!event.isVotingClosed ? (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center">
                  <Info className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold text-lg mb-2">Rewards Hidden Until Voting Closes</h4>
                  <p className="text-muted-foreground">
                    Reward amounts will be revealed after the voting deadline on {event.votingDeadline}. 
                    Cast your authentic prediction to maximize your earnings!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="w-6 h-6 text-warning" />
                      <h4 className="font-semibold text-lg">Digital Rewards (XP)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Distributed immediately after voting deadline
                    </p>
                    <div className="flex items-center justify-between">
                      <span>Match Majority Vote</span>
                      <span className="text-2xl font-bold text-warning">+{event.xpReward} XP</span>
                    </div>
                  </div>

                  <div className="bg-success/10 border border-success/30 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-success" />
                      <h4 className="font-semibold text-lg">Crypto Rewards</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Distributed when real-world outcome is verified{event.resultDeadline && ` (estimated ${event.resultDeadline})`}
                    </p>
                    <div className="flex items-center justify-between">
                      <span>Correct Prediction Pool</span>
                      <span className="text-2xl font-bold text-success">{event.cryptoReward}</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
