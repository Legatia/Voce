import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Trophy, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface EventCardProps {
  id: number;
  title: string;
  category: string;
  votingDeadline: string;
  resultDeadline?: string;
  participants: number;
  xpReward: number;
  cryptoReward: string;
  isVotingClosed?: boolean;
}

const EventCard = ({
  id,
  title,
  category,
  votingDeadline,
  resultDeadline,
  participants,
  xpReward,
  cryptoReward,
  isVotingClosed = false,
}: EventCardProps) => {
  return (
    <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <Badge variant="outline" className="bg-accent/10 border-accent text-accent-foreground">
          {category}
        </Badge>
        {isVotingClosed && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Voting Closed</span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-4 line-clamp-2 min-h-[3.5rem]">
        {title}
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-warning" />
          <span className="text-muted-foreground">Voting ends:</span>
          <span className="font-medium">{votingDeadline}</span>
        </div>

        {resultDeadline && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Est. Result:</span>
            <span className="font-medium">{resultDeadline}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-secondary" />
          <span className="text-muted-foreground">{participants.toLocaleString()} predictions</span>
        </div>
      </div>

      {isVotingClosed && (
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Digital Reward</span>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="font-bold text-warning">+{xpReward} XP</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Crypto Reward</span>
            <span className="font-bold text-success">{cryptoReward}</span>
          </div>
        </div>
      )}

      <Link to={`/event/${id}`}>
        <Button 
          variant={isVotingClosed ? "outline" : "gradient"} 
          className="w-full"
          disabled={isVotingClosed}
        >
          {isVotingClosed ? "View Results" : "Cast Your Prediction"}
        </Button>
      </Link>
    </div>
  );
};

export default EventCard;
