import { Shield, Eye, Globe, Gift } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Hidden Winning Ratios",
    description: "Vote based on your true belief. Winning percentages are hidden until the voting deadline to prevent bandwagon effects.",
  },
  {
    icon: Shield,
    title: "Dual Reward System",
    description: "Earn XP for matching the majority vote, plus crypto rewards when your prediction aligns with real-world results.",
  },
  {
    icon: Globe,
    title: "Global & Local Markets",
    description: "Participate in worldwide events or dive into continent and country-specific prediction markets.",
  },
  {
    icon: Gift,
    title: "Earn by Creating",
    description: "Post your own events and earn cryptocurrency rewards when others vote on them. Build the community, get rewarded.",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Voce is Different
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Combining the wisdom of crowds with real-world outcomes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gradient-card border border-border rounded-xl p-8 shadow-card hover:shadow-glow/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 shadow-glow">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
