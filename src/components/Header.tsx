import { Button } from "@/components/ui/button";
import { Wallet, Trophy, User, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { WalletConnect } from "@/aptos/components/WalletConnect";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Voce
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Markets
            </Link>
            <Link to="/categories" className="text-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link to="/marketplace" className="text-foreground hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link to="/create-event" className="text-foreground hover:text-primary transition-colors">
              Create Event
            </Link>
            <Link to="/leaderboard" className="text-foreground hover:text-primary transition-colors">
              Leaderboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/marketplace">
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Shop</span>
              </Button>
            </Link>
            <WalletConnect />
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
