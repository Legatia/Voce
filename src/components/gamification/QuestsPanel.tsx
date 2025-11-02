import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Quest } from '@/lib/gamification';
import { useGamification } from '@/hooks/useGamification';
import {
  Target,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Gift,
  AlertCircle,
  Zap,
  Crown
} from 'lucide-react';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface QuestsPanelProps {
  compact?: boolean;
}

const QuestsPanel: React.FC<QuestsPanelProps> = ({ compact = false }) => {
  const { dailyQuests, weeklyQuests, completeQuest } = useGamification();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) return { text: 'Expired', urgent: true };

    const hours = differenceInHours(expiresAt, now);
    const days = differenceInDays(expiresAt, now);

    if (days > 0) return { text: `${days}d ${hours % 24}h`, urgent: false };
    if (hours > 0) return { text: `${hours}h`, urgent: hours < 12 };
    return { text: '< 1h', urgent: true };
  };

  // Get quest icon based on type or reward
  const getQuestIcon = (quest: Quest) => {
    if (quest.reward.badgeId) return <Trophy className="w-5 h-5" />;
    if (quest.reward.tokens && quest.reward.tokens > 20) return <Crown className="w-5 h-5" />;
    if (quest.reward.tokens) return <Gift className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  // Get quest type color
  const getQuestTypeColor = (type: 'daily' | 'weekly') => {
    switch (type) {
      case 'daily':
        return {
          bg: 'bg-blue-50 border-blue-200',
          badge: 'bg-blue-500 text-white',
          text: 'text-blue-700'
        };
      case 'weekly':
        return {
          bg: 'bg-purple-50 border-purple-200',
          badge: 'bg-purple-500 text-white',
          text: 'text-purple-700'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-500 text-white',
          text: 'text-gray-700'
        };
    }
  };

  // Quest card component
  const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const timeRemaining = getTimeRemaining(quest.expiresAt);
    const typeColors = getQuestTypeColor(quest.type);
    const progressPercentage = (quest.progress / quest.requirement) * 100;
    const canComplete = quest.progress >= quest.requirement && !quest.completed;

    const handleComplete = () => {
      if (canComplete) {
        completeQuest(quest.id);
      }
    };

    return (
      <Card className={`overflow-hidden border-2 ${typeColors.bg} ${canComplete ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg ${typeColors.badge} flex items-center justify-center`}>
                {getQuestIcon(quest)}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{quest.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${typeColors.badge}`}>
                    {quest.type}
                  </Badge>
                  <div className={`flex items-center gap-1 text-xs ${timeRemaining.urgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                    <Clock className="w-3 h-3" />
                    <span>{timeRemaining.text}</span>
                  </div>
                </div>
              </div>
            </div>

            {quest.completed && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {quest.description}
          </p>

          {/* Progress bar */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className={quest.progress >= quest.requirement ? 'text-green-600 font-semibold' : ''}>
                {quest.progress} / {quest.requirement}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={`h-2 ${quest.progress >= quest.requirement ? 'bg-green-100' : ''}`}
            />
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-blue-600">
                <Zap className="w-3 h-3" />
                <span className="font-semibold">{quest.reward.xp} XP</span>
              </div>
              {quest.reward.tokens && (
                <div className="flex items-center gap-1 text-green-600">
                  <Gift className="w-3 h-3" />
                  <span className="font-semibold">{quest.reward.tokens} tokens</span>
                </div>
              )}
              {quest.reward.badgeId && (
                <Badge variant="outline" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  Badge
                </Badge>
              )}
            </div>

            {canComplete && (
              <Button
                size="sm"
                onClick={handleComplete}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Complete
              </Button>
            )}
          </div>

          {quest.completed && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Completed!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Compact view
  if (compact) {
    const allQuests = [...dailyQuests, ...weeklyQuests];
    const completedCount = allQuests.filter(q => q.completed).length;
    const completableCount = allQuests.filter(q => q.progress >= q.requirement && !q.completed).length;

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Quests</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{completedCount}/{allQuests.length}</Badge>
              {completableCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {completableCount} Ready
                </Badge>
              )}
            </div>
          </div>

          {completableCount > 0 && (
            <Alert className="mb-3 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have {completableCount} quest{completableCount > 1 ? 's' : ''} ready to complete!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {dailyQuests.slice(0, 2).map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  const activeQuests = activeTab === 'daily' ? dailyQuests : weeklyQuests;
  const completedCount = activeQuests.filter(q => q.completed).length;
  const completableCount = activeQuests.filter(q => q.progress >= q.requirement && !q.completed).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quests & Missions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {completedCount}/{activeQuests.length} Complete
            </Badge>
            {completableCount > 0 && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                {completableCount} Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {completableCount > 0 && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Great job!</strong> You have {completableCount} quest{completableCount > 1 ? 's' : ''} ready to complete. Claim your rewards now!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Tab navigation */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('daily')}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Daily Quests
              <Badge variant="secondary" className="ml-2">
                {dailyQuests.filter(q => q.completed).length}/{dailyQuests.length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('weekly')}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly Quests
              <Badge variant="secondary" className="ml-2">
                {weeklyQuests.filter(q => q.completed).length}/{weeklyQuests.length}
              </Badge>
            </Button>
          </div>

          {/* Quest list */}
          <div className="space-y-3">
            {activeQuests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No quests available at the moment.</p>
                <p className="text-sm">Check back later for new missions!</p>
              </div>
            ) : (
              activeQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestsPanel;