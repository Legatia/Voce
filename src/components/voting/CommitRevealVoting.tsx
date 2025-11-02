import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock, Eye, EyeOff, Hash, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { secureVotingService } from "@/aptos/services/secureVotingService";
import { useVoting } from "@/hooks/useVoting";
import { financialSystemService } from "@/aptos/services/financialSystemService";
import VoteTrackingGraph from "./VoteTrackingGraph";

interface CommitRevealVotingProps {
  event: {
    id: string;
    title: string;
    deadline: string;
    revealDeadline: string;
    options: Array<{ id: string; text: string }>;
    commitPhase: boolean;
    revealPhase: boolean;
  };
  onCommit?: (eventId: string, commitment: string, stake: number) => Promise<void>;
  onReveal?: (eventId: string, optionId: string, salt: string) => Promise<void>;
}

const CommitRevealVoting = ({ event, onCommit, onReveal }: CommitRevealVotingProps) => {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<"commit" | "reveal">("commit");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [salt, setSalt] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [commitment, setCommitment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSalt, setShowSalt] = useState(false);
  const [userCommitment, setUserCommitment] = useState<any>(null);
  const [userReveal, setUserReveal] = useState<any>(null);

  // Generate random salt
  const generateSalt = () => {
    const randomSalt = Math.random().toString(36).substring(2, 15);
    setSalt(randomSalt);
  };

  // Generate commitment from option and salt
  const generateCommitment = (optionId: string, saltValue: string): string => {
    const combined = `${optionId}:${saltValue}:${event.id}`;
    // Simple hash function (in production, use crypto hashing)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
  };

  // Update commitment when option or salt changes
  useEffect(() => {
    if (selectedOption && salt) {
      const newCommitment = generateCommitment(selectedOption, salt);
      setCommitment(newCommitment);
    }
  }, [selectedOption, salt, event.id]);

  // Load user's existing commitment/reveal from localStorage
  useEffect(() => {
    const key = `commitment_${event.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      setUserCommitment(data.commitment);
      setUserReveal(data.reveal);

      // Restore selected option and salt from saved commitment
      if (data.commitment) {
        setSelectedOption(data.commitment.optionId || "");
        setSalt(data.commitment.salt || "");
      }

      if (data.reveal) {
        setActiveTab("reveal");
      }
    }
  }, [event.id]);

  const handleCommit = async () => {
    if (!selectedOption || !salt || !commitment || parseFloat(stakeAmount) <= 0) {
      return;
    }

    setIsProcessing(true);
    try {
      await onCommit?.(event.id, commitment, parseFloat(stakeAmount));

      // Save commitment locally (backup for UI state)
      const commitmentData = {
        eventId: event.id,
        commitment,
        stake: parseFloat(stakeAmount),
        timestamp: Date.now(),
        optionId: selectedOption,
        salt: salt,
      };

      const key = `commitment_${event.id}`;
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      data.commitment = commitmentData;
      localStorage.setItem(key, JSON.stringify(data));

      setUserCommitment(commitmentData);

      // Show success message
      alert("Vote committed successfully! Save your salt securely for the reveal phase.");
    } catch (error) {
      console.error("Commit failed:", error);
      alert("Failed to commit vote. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReveal = async () => {
    if (!selectedOption || !salt) {
      return;
    }

    setIsProcessing(true);
    try {
      await onReveal?.(event.id, selectedOption, salt);

      // Save reveal locally (backup for UI state)
      const revealData = {
        eventId: event.id,
        optionId: selectedOption,
        salt,
        timestamp: Date.now(),
      };

      const key = `commitment_${event.id}`;
      const existing = localStorage.getItem(key);
      const data = existing ? JSON.parse(existing) : {};
      data.reveal = revealData;
      localStorage.setItem(key, JSON.stringify(data));

      setUserReveal(revealData);

      // Show success message
      alert("Vote revealed successfully!");
    } catch (error) {
      console.error("Reveal failed:", error);
      alert("Failed to reveal vote. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const timeUntilCommit = getTimeRemaining(event.deadline);
  const timeUntilReveal = getTimeRemaining(event.revealDeadline);

  const canCommit = event.commitPhase && timeUntilCommit > 0 && !userCommitment;
  const canReveal = event.revealPhase && timeUntilReveal > 0 && userCommitment && !userReveal;

  // Check if voting has ended (both commit and reveal phases are over)
  const votingEnded = !event.commitPhase && !event.revealPhase && (timeUntilCommit <= 0 && timeUntilReveal <= 0);

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription>
                Commit-Reveal Voting System - Prevents front-running and herd behavior
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {event.commitPhase && (
                <Badge className="bg-orange-500">
                  <Lock className="w-3 h-3 mr-1" />
                  Commit Phase
                </Badge>
              )}
              {event.revealPhase && (
                <Badge className="bg-green-500">
                  <Unlock className="w-3 h-3 mr-1" />
                  Reveal Phase
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "commit" | "reveal")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="commit" disabled={userCommitment}>
                {userCommitment ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Committed
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Commit Vote
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger value="reveal" disabled={!userCommitment}>
                {userReveal ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Revealed
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Reveal Vote
                  </>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commit" className="space-y-4">
              {userCommitment ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Vote Committed!</strong> Your commitment hash: {userCommitment.commitment}
                    <br />
                    <span className="text-xs">
                      Save your salt: {userCommitment.salt || salt || "Lost - check your records"}
                    </span>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Commit Phase:</strong> Select your option and generate a commitment.
                      Your vote will be hidden until the reveal phase begins.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Option</Label>
                      <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                        {event.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`commit-${option.id}`} />
                            <Label htmlFor={`commit-${option.id}`}>{option.text}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salt">Secret Salt</Label>
                      <div className="flex gap-2">
                        <Input
                          id="salt"
                          type={showSalt ? "text" : "password"}
                          value={salt}
                          onChange={(e) => setSalt(e.target.value)}
                          placeholder="Generate or enter a secret salt"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSalt}
                          disabled={isProcessing}
                        >
                          Generate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSalt(!showSalt)}
                        >
                          {showSalt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This salt is needed to reveal your vote. Save it securely!
                      </p>
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
                    </div>

                    {commitment && (
                      <div className="space-y-2">
                        <Label>Generated Commitment</Label>
                        <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                          <Hash className="w-4 h-4 inline mr-2" />
                          {commitment}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining:</span>
                        <span>{timeUntilCommit > 0 ? `${Math.floor(timeUntilCommit / 3600)}h ${Math.floor((timeUntilCommit % 3600) / 60)}m` : "Ended"}</span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, ((timeUntilCommit / (24 * 3600)) * 100)))}
                        className="h-2"
                      />
                    </div>

                    <Button
                      onClick={handleCommit}
                      disabled={!canCommit || !isConnected || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Processing..." : "Commit Vote"}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="reveal" className="space-y-4">
              {userReveal ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Vote Revealed!</strong> Your vote for "{event.options.find(o => o.id === userReveal.optionId)?.text}" has been successfully revealed.
                  </AlertDescription>
                </Alert>
              ) : userCommitment ? (
                <>
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Reveal Phase:</strong> Enter your original option and salt to reveal your vote.
                      Your commitment: {userCommitment.commitment}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Original Option</Label>
                      <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                        {event.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`reveal-${option.id}`} />
                            <Label htmlFor={`reveal-${option.id}`}>{option.text}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reveal-salt">Your Secret Salt</Label>
                      <Input
                        id="reveal-salt"
                        type="password"
                        value={salt}
                        onChange={(e) => setSalt(e.target.value)}
                        placeholder="Enter the salt you used during commit"
                      />
                      <p className="text-xs text-muted-foreground">
                        This must match the salt you used during the commit phase.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Time Remaining:</span>
                        <span>{timeUntilReveal > 0 ? `${Math.floor(timeUntilReveal / 3600)}h ${Math.floor((timeUntilReveal % 3600) / 60)}m` : "Ended"}</span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, ((timeUntilReveal / (24 * 3600)) * 100)))}
                        className="h-2"
                      />
                    </div>

                    <Button
                      onClick={handleReveal}
                      disabled={!canReveal || !isConnected || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Processing..." : "Reveal Vote"}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert className="bg-gray-50 border-gray-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Not Committed:</strong> You must commit your vote during the commit phase before you can reveal it.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
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
              console.log("Show detailed analysis");
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

export default CommitRevealVoting;