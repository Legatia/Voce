import { Vote, Trophy, Coins, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Vote,
    title: "Cast Your Prediction",
    description: "Vote on real-world events before the voting deadline. Winning ratios are hidden to encourage authentic beliefs.",
    color: "text-primary",
  },
  {
    icon: Trophy,
    title: "Earn XP (Digital Rewards)",
    description: "When voting closes, if you aligned with the majority, earn platform XP and points immediately.",
    color: "text-warning",
  },
  {
    icon: TrendingUp,
    title: "Wait for Real Results",
    description: "The event unfolds in the real world. Did your prediction match reality?",
    color: "text-secondary",
  },
  {
    icon: Coins,
    title: "Win Crypto Rewards",
    description: "When real-world results are confirmed, winners get cryptocurrency rewards directly to their wallet.",
    color: "text-success",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A unique hybrid system rewarding both social consensus and real-world accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border mb-4 shadow-card">
                    <Icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent -translate-x-1/2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
