import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MysteryCrate, CrateReward, useGamification } from '@/lib/gamification';
import { MYSTERY_CRATES } from '@/lib/gamification';
import {
  Package,
  Gift,
  Sparkles,
  Zap,
  Trophy,
  Star,
  Crown,
  Coins,
  Lock,
  Unlock,
  Dice3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface MysteryCratesProps {
  compact?: boolean;
}

interface CrateOpenAnimationProps {
  rewards: CrateReward[];
  onClose: () => void;
}

const CrateOpenAnimation: React.FC<CrateOpenAnimationProps> = ({ rewards, onClose }) => {
  const [showRewards, setShowRewards] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowRewards(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp_booster': return <Zap className="w-8 h-8 text-blue-500" />;
      case 'tokens': return <Coins className="w-8 h-8 text-green-500" />;
      case 'badge': return <Trophy className="w-8 h-8 text-purple-500" />;
      case 'title': return <Crown className="w-8 h-8 text-yellow-500" />;
      default: return <Gift className="w-8 h-8 text-gray-500" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white';
      case 'epic': return 'bg-gradient-to-br from-purple-400 to-purple-600 text-white';
      case 'rare': return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';
      default: return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Crate Opening Results
          </DialogTitle>
          <DialogDescription>
            See what you've discovered!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!showRewards ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Package className="w-20 h-20 text-blue-500 animate-bounce" />
                <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <p className="text-lg font-semibold">Opening your crate...</p>
              <div className="flex space-x-1">
                <Dice3 className="w-6 h-6 text-blue-500 animate-spin" />
                <Dice3 className="w-6 h-6 text-purple-500 animate-spin" style={{ animationDelay: '0.2s' }} />
                <Dice3 className="w-6 h-6 text-green-500 animate-spin" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg ${getRarityColor(reward.rarity)} animate-in slide-in-from-bottom duration-500`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {getRewardIcon(reward.type)}
                  <div className="flex-1">
                    <div className="font-semibold capitalize">
                      {reward.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm opacity-90">
                      {typeof reward.value === 'number' ? (
                        <>
                          {reward.type === 'xp_booster' && `+${reward.value} XP`}
                          {reward.type === 'tokens' && `+${reward.value} Tokens`}
                        </>
                      ) : (
                        reward.value
                      )}
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {reward.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {showRewards && (
          <div className="flex justify-center">
            <Button onClick={onClose} className="bg-gradient-to-r from-blue-500 to-purple-600">
              Claim Rewards
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MysteryCrates: React.FC<MysteryCratesProps> = ({ compact = false }) => {
  const { progress, openMysteryCrate } = useGamification();
  const [openingCrate, setOpeningCrate] = useState<MysteryCrate | null>(null);
  const [openResult, setOpenResult] = useState<{ rewards: CrateReward[] } | null>(null);

  const handleOpenCrate = async (crate: MysteryCrate) => {
    if (!progress || progress.xp < crate.cost) return;

    setOpeningCrate(crate);
    const result = await openMysteryCrate(crate.id);

    if (result && result.rewards.length > 0) {
      setOpenResult(result);
    } else {
      setOpeningCrate(null);
    }
  };

  const handleCloseAnimation = () => {
    setOpenResult(null);
    setOpeningCrate(null);
  };

  const getCrateRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 bg-yellow-50';
      case 'epic': return 'border-purple-500 bg-purple-50';
      case 'rare': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getHighestRarity = (possibleRewards: CrateReward[]) => {
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const highestRarity = possibleRewards.reduce((highest, reward) => {
      const rewardLevel = rarityOrder[reward.rarity] || 0;
      const highestLevel = rarityOrder[highest.rarity] || 0;
      return rewardLevel > highestLevel ? reward : highest;
    }, possibleRewards[0]);

    return highestRarity.rarity;
  };

  if (!progress) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Lock className="w-8 h-8 mx-auto mb-2" />
          <p>Connect your wallet to access Mystery Crates</p>
        </CardContent>
      </Card>
    );
  }

  // Check if user has unlocked mystery crates (level 5+)
  if (progress.level < 5) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Mystery Crates Locked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Reach level 5 to unlock Mystery Crates and discover exclusive rewards!
          </p>
          <div className="text-sm">
            <span className="text-muted-foreground">Current progress:</span>
            <span className="font-semibold ml-1">Level {progress.level} / 5</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view
  if (compact) {
    const affordableCrates = MYSTERY_CRATES.filter(crate => progress.xp >= crate.cost);

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Mystery Crates</h3>
            </div>
            <Badge variant="secondary">{affordableCrates.length} Available</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MYSTERY_CRATES.slice(0, 2).map((crate) => {
              const canAfford = progress.xp >= crate.cost;
              const highestRarity = getHighestRarity(crate.possibleRewards);

              return (
                <Button
                  key={crate.id}
                  variant="outline"
                  className={`p-3 h-auto ${!canAfford ? 'opacity-50' : 'hover:border-purple-400'}`}
                  disabled={!canAfford || openingCrate !== null}
                  onClick={() => handleOpenCrate(crate)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{crate.icon}</div>
                    <div className="text-xs font-semibold">{crate.name}</div>
                    <div className="text-xs text-muted-foreground">{crate.cost} XP</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {openingCrate && (
            <div className="mt-3 text-center text-sm text-purple-600">
              <Package className="w-4 h-4 inline mr-1 animate-spin" />
              Opening crate...
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Mystery Crates
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Your XP: <span className="font-bold text-blue-600">{progress.xp.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-purple-50 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong> Mystery Crates contain random rewards!</strong> Spend your XP to unlock exclusive badges, XP boosters, tokens, and unique titles. Higher tier crates have better rewards!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MYSTERY_CRATES.map((crate) => {
              const canAfford = progress.xp >= crate.cost;
              const highestRarity = getHighestRarity(crate.possibleRewards);
              const isCurrentlyOpening = openingCrate?.id === crate.id;

              return (
                <Card
                  key={crate.id}
                  className={`overflow-hidden border-2 ${getCrateRarityColor(highestRarity)} ${
                    canAfford && !openingCrate ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''
                  } ${isCurrentlyOpening ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${getCrateRarityColor(highestRarity)} flex items-center justify-center text-2xl`}>
                          {crate.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{crate.name}</h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getCrateRarityColor(highestRarity)}`}
                          >
                            {highestRarity} Max
                          </Badge>
                        </div>
                      </div>

                      {isCurrentlyOpening && (
                        <div className="animate-spin">
                          <Package className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {crate.description}
                    </p>

                    {/* Possible rewards preview */}
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground mb-2">Possible Rewards:</div>
                      <div className="flex flex-wrap gap-1">
                        {crate.possibleRewards.slice(0, 3).map((reward, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {reward.type === 'xp_booster' && <Zap className="w-3 h-3 mr-1" />}
                            {reward.type === 'tokens' && <Coins className="w-3 h-3 mr-1" />}
                            {reward.type === 'badge' && <Trophy className="w-3 h-3 mr-1" />}
                            {reward.type === 'title' && <Crown className="w-3 h-3 mr-1" />}
                            {reward.rarity}
                          </Badge>
                        ))}
                        {crate.possibleRewards.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{crate.possibleRewards.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-blue-600">{crate.cost} XP</span>
                      </div>

                      <Button
                        size="sm"
                        disabled={!canAfford || openingCrate !== null}
                        onClick={() => handleOpenCrate(crate)}
                        className={canAfford && !openingCrate ? 'bg-purple-500 hover:bg-purple-600' : ''}
                      >
                        {isCurrentlyOpening ? (
                          <>
                            <Package className="w-4 h-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : canAfford ? (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Open Crate
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Need {crate.cost - progress.xp} XP
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {progress.xp < Math.min(...MYSTERY_CRATES.map(c => c.cost)) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need at least {Math.min(...MYSTERY_CRATES.map(c => c.cost))} XP to open a Mystery Crate.
                Complete more quests and vote on events to earn XP!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {openResult && (
        <CrateOpenAnimation
          rewards={openResult.rewards}
          onClose={handleCloseAnimation}
        />
      )}
    </>
  );
};

export default MysteryCrates;