import { Trophy } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Voce
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The hybrid prediction market where your voice earns rewards.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Markets</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Global Events</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Americas</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Europe</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Asia</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Africa</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Create Event</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Leaderboard</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Voce. All rights reserved. Built with transparency and trust.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
