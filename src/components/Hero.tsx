import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Voce prediction market" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Predict the Future,
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {" "}Earn Rewards
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Vote on real-world events. Earn XP for matching the majority. Win crypto when your prediction matches reality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="gradient" size="lg" className="text-lg">
              Start Predicting
            </Button>
            <Button variant="outline" size="lg" className="text-lg">
              Create Event
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-3xl font-bold">1,247</h3>
              </div>
              <p className="text-muted-foreground">Active Markets</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-secondary" />
                <h3 className="text-3xl font-bold">45K+</h3>
              </div>
              <p className="text-muted-foreground">Predictors</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-warning" />
                <h3 className="text-3xl font-bold">$2.4M</h3>
              </div>
              <p className="text-muted-foreground">Rewards Paid</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
