import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge as BadgeType } from '@/lib/gamification';
import {
  Award,
  Trophy,
  Star,
  Target,
  Flame,
  Eye,
  Zap,
  Crown,
  Calendar,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface BadgesDisplayProps {
  badges: BadgeType[];
  compact?: boolean;
  showCount?: boolean;
}

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({
  badges,
  compact = false,
  showCount = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'voting': return <Target className="w-4 h-4" />;
      case 'streak': return <Flame className="w-4 h-4" />;
      case 'accuracy': return <Eye className="w-4 h-4" />;
      case 'special': return <Star className="w-4 h-4" />;
      case 'seasonal': return <Calendar className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  // Get rarity styling
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-amber-600',
          border: 'border-amber-500',
          text: 'text-amber-900',
          shadow: 'shadow-lg shadow-amber-500/30'
        };
      case 'epic':
        return {
          bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
          border: 'border-purple-500',
          text: 'text-purple-900',
          shadow: 'shadow-lg shadow-purple-500/30'
        };
      case 'rare':
        return {
          bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
          border: 'border-blue-500',
          text: 'text-blue-900',
          shadow: 'shadow-lg shadow-blue-500/30'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
          border: 'border-gray-500',
          text: 'text-gray-900',
          shadow: 'shadow-md shadow-gray-500/20'
        };
    }
  };

  // Badge card component
  const BadgeCard: React.FC<{ badge: BadgeType; detailed?: boolean }> = ({
    badge,
    detailed = true
  }) => {
    const rarityStyles = getRarityStyles(badge.rarity);

    if (!detailed) {
      return (
        <div
          className={`w-12 h-12 rounded-lg ${rarityStyles.bg} ${rarityStyles.shadow} flex items-center justify-center text-white text-xl cursor-pointer hover:scale-105 transition-transform`}
          title={`${badge.name}: ${badge.description}`}
        >
          {badge.icon}
        </div>
      );
    }

    return (
      <div className={`relative group cursor-pointer`}>
        <Card className={`overflow-hidden border-2 ${rarityStyles.border} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-lg ${rarityStyles.bg} ${rarityStyles.shadow} flex items-center justify-center text-white text-xl`}>
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">{badge.name}</h4>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${rarityStyles.text} bg-muted/50`}
                  >
                    {badge.rarity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {badge.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(badge.earnedAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hover effect with additional details */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <Card className="w-64 p-3 shadow-xl border-2 border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded ${rarityStyles.bg} flex items-center justify-center text-white text-sm`}>
                {badge.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{badge.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {badge.category}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {badge.description}
            </p>
          </Card>
        </div>
      </div>
    );
  };

  // Compact badge list
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {badges.slice(0, 8).map((badge) => (
            <BadgeCard key={badge.id} badge={badge} detailed={false} />
          ))}
          {badges.length > 8 && (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              +{badges.length - 8}
            </div>
          )}
        </div>
        {showCount && (
          <Badge variant="secondary" className="ml-2">
            {badges.length} Badges
          </Badge>
        )}
      </div>
    );
  }

  // Full badge display with categories
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Badge Collection
          </CardTitle>
          {showCount && (
            <Badge variant="secondary" className="ml-2">
              {badges.length} Earned
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No badges earned yet.</p>
            <p className="text-sm">Start voting and completing quests to earn your first badge!</p>
          </div>
        ) : (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                All ({badges.length})
              </TabsTrigger>
              {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {getCategoryIcon(category)}
                  <span className="hidden sm:inline ml-1">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                  <span className="sm:hidden">
                    {category.slice(0, 4)}
                  </span>
                  ({categoryBadges.length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges
                  .sort((a, b) => {
                    // Sort by rarity first, then by date earned
                    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
                    const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                    if (rarityDiff !== 0) return rarityDiff;
                    return b.earnedAt - a.earnedAt;
                  })
                  .map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
              </div>
            </TabsContent>

            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h3 className="font-semibold capitalize">{category} Badges</h3>
                    <Badge variant="outline">{categoryBadges.length}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBadges
                    .sort((a, b) => b.earnedAt - a.earnedAt)
                    .map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesDisplay;