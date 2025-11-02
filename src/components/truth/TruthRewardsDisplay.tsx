import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Gift,
  Crown,
  Calculator,
  CheckCircle,
  AlertCircle,
  Coins,
  Clock,
  Target,
  Award,
  Zap
} from "lucide-react";
import { useTruthRewards } from "@/hooks/useTruthRewards";

interface TruthRewardsDisplayProps {
  eventId?: number;
  showCalculations?: boolean;
  compact?: boolean;
}

const TruthRewardsDisplay = ({
  eventId,
  showCalculations = true,
  compact = false
}: TruthRewardsDisplayProps) => {
  const {
    claimableRewards,
    isProcessing,
    error,
    totalEarned,
    getRewardBreakdown,
    claimWinnerReward,
    claimCreatorReward,
    batchClaimRewards,
    clearError,
    REWARD_CONSTANTS
  } = useTruthRewards();

  const [rewardBreakdown, setRewardBreakdown] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResults, setClaimResults] = useState<any>(null);

  React.useEffect(() => {
    if (eventId) {
      loadRewardBreakdown();
    }
  }, [eventId]);

  const loadRewardBreakdown = async () => {
    if (!eventId) return;

    try {
      const breakdown = await getRewardBreakdown(eventId);
      setRewardBreakdown(breakdown);
    } catch (error) {
      console.error("Failed to load reward breakdown:", error);
    }
  };

  const handleClaimAll = async () => {
    try {
      setIsClaiming(true);
      const results = await batchClaimRewards();
      setClaimResults(results);
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimWinner = async (eventCreator: string, eventId: number) => {
    try {
      await claimWinnerReward(eventCreator, eventId);
      // Refresh claimable rewards
      window.location.reload();
    } catch (error) {
      console.error("Failed to claim winner reward:", error);
    }
  };

  const handleClaimCreator = async (eventId: number) => {
    try {
      await claimCreatorReward(eventId);
      // Refresh claimable rewards
      window.location.reload();
    } catch (error) {
      console.error("Failed to claim creator reward:", error);
    }
  };

  // Calculate mock breakdown for demonstration
  const mockBreakdown = rewardBreakdown || {
    totalPrizePool: 10000,
    winnerShare: 6000,
    creatorReward: 500,
    platformFee: 3500,
    winnerSharePerPerson: 2000,
    numberOfWinners: 3
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Truth Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Earned */}
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <div>
              <div className="text-sm font-medium">Total Earned</div>
              <div className="text-xs text-muted-foreground">All time</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {totalEarned.toFixed(2)} APT
              </div>
            </div>
          </div>

          {/* Claimable Rewards */}
          {(claimableRewards.winnerClaims.length > 0 || claimableRewards.creatorClaims.length > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Claimable Rewards</span>
                <Badge variant="outline">
                  {claimableRewards.winnerClaims.length + claimableRewards.creatorClaims.length} available
                </Badge>
              </div>
              <Button
                onClick={handleClaimAll}
                disabled={isClaiming || isProcessing}
                className="w-full"
                size="sm"
              >
                {isClaiming ? 'Claiming...' : 'Claim All Rewards'}
              </Button>
            </div>
          )}

          {/* Reward Distribution */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Reward Distribution
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Winners (60%)</span>
                <span className="font-medium">{mockBreakdown.winnerShare} APT</span>
              </div>
              <div className="flex justify-between">
                <span>Creator (5%)</span>
                <span className="font-medium">{mockBreakdown.creatorReward} APT</span>
              </div>
              <div className="flex justify-between">
                <span>Platform (35%)</span>
                <span className="font-medium">{mockBreakdown.platformFee} APT</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Reward Distribution Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Truth Reward Distribution
          </CardTitle>
          <CardDescription>
            Automatic reward distribution for truth event participants and creators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reward Breakdown */}
          {showCalculations && mockBreakdown && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Reward Breakdown
              </h3>

              {/* Total Prize Pool */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {mockBreakdown.totalPrizePool.toFixed(2)} APT
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              {/* Distribution Visual */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Winners ({REWARD_CONSTANTS.WINNER_SHARE_PERCENTAGE}%)</span>
                  <span className="text-sm font-bold text-green-600">
                    {mockBreakdown.winnerShare.toFixed(2)} APT
                  </span>
                </div>
                <Progress value={REWARD_CONSTANTS.WINNER_SHARE_PERCENTAGE} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Creator ({REWARD_CONSTANTS.CREATOR_SHARE_PERCENTAGE}%)</span>
                  <span className="text-sm font-bold text-purple-600">
                    {mockBreakdown.creatorReward.toFixed(2)} APT
                  </span>
                </div>
                <Progress value={REWARD_CONSTANTS.CREATOR_SHARE_PERCENTAGE} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Platform ({REWARD_CONSTANTS.PLATFORM_FEE_PERCENTAGE}%)</span>
                  <span className="text-sm font-bold text-gray-600">
                    {mockBreakdown.platformFee.toFixed(2)} APT
                  </span>
                </div>
                <Progress value={REWARD_CONSTANTS.PLATFORM_FEE_PERCENTAGE} className="h-2" />
              </div>

              {/* Per Winner Amount */}
              {mockBreakdown.numberOfWinners > 0 && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold">Each Winner Receives</div>
                        <div className="text-sm text-muted-foreground">
                          {mockBreakdown.numberOfWinners} winners total
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {mockBreakdown.winnerSharePerPerson.toFixed(2)} APT
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* User Earnings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              Your Earnings
            </h3>

            {/* Total Earned */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Earned</div>
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {totalEarned.toFixed(2)} APT
                  </div>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            {/* Claimable Rewards */}
            {(claimableRewards.winnerClaims.length > 0 || claimableRewards.creatorClaims.length > 0) && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Available Rewards
                  </h4>
                  <Badge variant="outline">
                    {claimableRewards.winnerClaims.length + claimableRewards.creatorClaims.length} available
                  </Badge>
                </div>

                {/* Winner Rewards */}
                {claimableRewards.winnerClaims.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="w-4 h-4" />
                      Winner Rewards ({claimableRewards.winnerClaims.length})
                    </div>
                    {claimableRewards.winnerClaims.slice(0, 3).map((claim, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Event {claim.eventId}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClaimWinner(claim.creator, claim.eventId)}
                          disabled={isProcessing}
                        >
                          Claim
                        </Button>
                      </div>
                    ))}
                    {claimableRewards.winnerClaims.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{claimableRewards.winnerClaims.length - 3} more...
                      </div>
                    )}
                  </div>
                )}

                {/* Creator Rewards */}
                {claimableRewards.creatorClaims.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Crown className="w-4 h-4" />
                      Creator Rewards ({claimableRewards.creatorClaims.length})
                    </div>
                    {claimableRewards.creatorClaims.slice(0, 3).map((eventId, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Your Event {eventId}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClaimCreator(eventId)}
                          disabled={isProcessing}
                        >
                          Claim
                        </Button>
                      </div>
                    ))}
                    {claimableRewards.creatorClaims.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{claimableRewards.creatorClaims.length - 3} more...
                      </div>
                    )}
                  </div>
                )}

                {/* Claim All Button */}
                <Button
                  onClick={handleClaimAll}
                  disabled={isClaiming || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isClaiming ? 'Claiming All...' : 'Claim All Rewards'}
                </Button>
              </div>
            )}

            {/* No Claimable Rewards */}
            {claimableRewards.winnerClaims.length === 0 && claimableRewards.creatorClaims.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No claimable rewards available.</p>
                <p className="text-sm">Participate in truth events to earn rewards!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claim Results */}
      {claimResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Claim Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Successful Claims */}
            {claimResults.successful.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Successful Claims</h4>
                {claimResults.successful.map((result: string, index: number) => (
                  <div key={index} className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    {result}
                  </div>
                ))}
              </div>
            )}

            {/* Failed Claims */}
            {claimResults.failed.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Failed Claims</h4>
                {claimResults.failed.map((result: any, index: number) => (
                  <div key={index} className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="font-medium">{result.tx}</div>
                    <div className="text-red-600">{result.error}</div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setClaimResults(null)}
              variant="outline"
              className="w-full"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TruthRewardsDisplay;