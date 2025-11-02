import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Timer, Users, Vote, Lock, Unlock, AlertCircle, CheckCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import VoteTrackingGraph from "./VoteTrackingGraph";

interface VotingCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    deadline: string;
    totalPool: number;
    participants: number;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: number;
    }>;
    status: "active" | "resolved" | "pending";
    resolution?: string;
    userVote?: string;
    hasVoted?: boolean;
  };
  onVote?: (eventId: string, optionId: string, stake: number) => Promise<void>;
  showResults?: boolean;
}

const VotingCard = ({ event, onVote, showResults = false }: VotingCardProps) => {
  const { isConnected, account } = useWallet();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [isVoting, setIsVoting] = useState(false);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  const timeRemaining = getTimeRemaining(event.deadline);
  const canVote = isConnected && event.status === "active" && !event.hasVoted && timeRemaining > 0;
  const isVotingOpen = event.status === "active" && timeRemaining > 0;
  const votingEnded = event.status !== "active" && timeRemaining <= 0;

  const handleVote = async () => {
    if (!selectedOption || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      return;
    }

    setIsVoting(true);
    try {
      await onVote?.(event.id, selectedOption, parseFloat(stakeAmount));
      setVoteSuccess(true);
      setShowVotingDialog(false);
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "resolved":
        return <Badge className="bg-blue-500">Resolved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription>{event.description}</CardDescription>
              <div className="flex gap-2">
                {getStatusBadge()}
                <Badge variant="outline">{event.category}</Badge>
              </div>
            </div>
            {event.userVote && (
              <Badge variant="secondary" className="gap-1">
                <Vote className="w-3 h-3" />
                Voted
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Voting Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Options</h4>
              {isVotingOpen && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Hidden Until Deadline
                </Badge>
              )}
            </div>

            {/* Info alert about hidden votes */}
            {isVotingOpen && (
              <Alert className="bg-blue-50 border-blue-200">
                <Lock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong className="text-blue-900">Fair voting:</strong> Vote counts are hidden until the deadline to prevent front-running and ensure fair predictions.
                </AlertDescription>
              </Alert>
            )}
            {event.options.map((option) => (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{option.text}</span>
                  {/* Only show vote counts and percentages after voting deadline */}
                  {!isVotingOpen && (
                    <span className="text-sm text-muted-foreground">
                      {option.votes} votes ({option.percentage}%)
                    </span>
                  )}
                  {/* Show "Voting Hidden" message during voting period */}
                  {isVotingOpen && (
                    <span className="text-sm text-muted-foreground italic">
                      Hidden until deadline
                    </span>
                  )}
                </div>
                {/* Only show progress bars after voting deadline */}
                {!isVotingOpen && <Progress value={option.percentage} className="h-2" />}
                {/* Show user's vote indicator regardless of voting status */}
                {event.userVote === option.id && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Your Vote
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{event.participants}</p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {timeRemaining > 0 ? `${Math.floor(timeRemaining / 3600)}h` : "Ended"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeRemaining > 0 ? "Time Left" : "Final"}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution (if resolved) */}
          {event.status === "resolved" && event.resolution && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Result:</strong> {event.resolution}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          {event.status === "active" && !event.hasVoted ? (
            <Dialog open={showVotingDialog} onOpenChange={setShowVotingDialog}>
              <DialogTrigger asChild>
                <Button
                  className="flex-1"
                  disabled={!canVote}
                  variant={!isConnected ? "outline" : "default"}
                >
                  {!isConnected ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Connect Wallet to Vote
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4 mr-2" />
                      Vote Now
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cast Your Vote</DialogTitle>
                  <DialogDescription>
                    Select an option and stake your tokens. This will be locked until the event is resolved.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Option</Label>
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                      {event.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id}>{option.text}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stake">Stake Amount (APT)</Label>
                    <Input
                      id="stake"
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount to stake"
                      min="1"
                      step="0.1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your stake will be returned with rewards if you vote correctly.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowVotingDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVote}
                    disabled={!selectedOption || !stakeAmount || parseFloat(stakeAmount) <= 0 || isVoting}
                  >
                    {isVoting ? "Voting..." : "Confirm Vote"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : event.hasVoted ? (
            <Button variant="outline" className="flex-1" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Vote Cast
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Voting Closed
            </Button>
          )}

          {showResults && (
            <Button variant="outline" onClick={() => window.open(`/event/${event.id}`, "_blank")}>
              View Details
            </Button>
          )}
        </CardFooter>

        {voteSuccess && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your vote has been successfully cast! Your stake is locked until the event is resolved.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Vote Tracking Graph - Show after voting deadline */}
      {votingEnded && (
        <div className="mt-6">
          <VoteTrackingGraph
            event={{
              ...event,
              status: "resolved"
            }}
            onShowDetails={() => {
              // Could show a more detailed analysis modal
              console.log("Show detailed analysis for event:", event.id);
            }}
          />
        </div>
      )}
    </>
  );
};

// Helper function to calculate time remaining
function getTimeRemaining(deadline: string): number {
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();
  return Math.max(0, Math.floor((deadlineTime - currentTime) / 1000));
}

export default VotingCard;