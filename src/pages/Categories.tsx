import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Globe, MapPin } from "lucide-react";

const categories = [
  {
    id: "global",
    name: "Global",
    icon: Globe,
    description: "Worldwide events affecting everyone",
    color: "text-primary",
    events: [
      {
        id: 1,
        title: "Will AI achieve AGI by December 2025?",
        category: "Technology",
        votingDeadline: "Dec 1, 2025",
        resultDeadline: "Jan 1, 2026",
        participants: 2847,
        xpReward: 500,
        cryptoReward: "500 USDC",
        isVotingClosed: false,
      },
      {
        id: 2,
        title: "Bitcoin to reach $100K before Q2 2025?",
        category: "Crypto",
        votingDeadline: "Mar 15, 2025",
        resultDeadline: "Jul 1, 2025",
        participants: 5234,
        xpReward: 750,
        cryptoReward: "800 USDC",
        isVotingClosed: false,
      },
      {
        id: 6,
        title: "SpaceX Mars mission announced before 2026?",
        category: "Space",
        votingDeadline: "Jun 30, 2025",
        resultDeadline: "Dec 31, 2025",
        participants: 6789,
        xpReward: 900,
        cryptoReward: "900 USDC",
        isVotingClosed: false,
      },
    ],
  },
  {
    id: "americas",
    name: "Americas",
    icon: MapPin,
    description: "Events from North, Central, and South America",
    color: "text-success",
    events: [
      {
        id: 10,
        title: "2024 US Elections: Voter turnout above 65%?",
        category: "Politics",
        votingDeadline: "Nov 1, 2024",
        resultDeadline: "Nov 15, 2024",
        participants: 8921,
        xpReward: 1000,
        cryptoReward: "1000 USDC",
        isVotingClosed: true,
      },
      {
        id: 11,
        title: "Tesla stock to surpass $300 by end of 2024?",
        category: "Finance",
        votingDeadline: "Dec 15, 2024",
        resultDeadline: "Jan 5, 2025",
        participants: 3456,
        xpReward: 600,
        cryptoReward: "600 USDC",
        isVotingClosed: false,
      },
      {
        id: 12,
        title: "Brazil GDP growth to exceed 3% in 2025?",
        category: "Economy",
        votingDeadline: "Dec 20, 2024",
        resultDeadline: "Mar 31, 2025",
        participants: 1823,
        xpReward: 450,
        cryptoReward: "450 USDC",
        isVotingClosed: false,
      },
    ],
  },
  {
    id: "europe",
    name: "Europe",
    icon: MapPin,
    description: "European markets and predictions",
    color: "text-secondary",
    events: [
      {
        id: 20,
        title: "EU to implement AI regulation by mid-2025?",
        category: "Policy",
        votingDeadline: "May 1, 2025",
        resultDeadline: "Jul 1, 2025",
        participants: 4567,
        xpReward: 700,
        cryptoReward: "70 USDC",
        isVotingClosed: false,
      },
      {
        id: 21,
        title: "Germany election: Coalition government formed?",
        category: "Politics",
        votingDeadline: "Sep 15, 2025",
        resultDeadline: "Oct 31, 2025",
        participants: 3289,
        xpReward: 650,
        cryptoReward: "65 USDC",
        isVotingClosed: false,
      },
    ],
  },
  {
    id: "asia",
    name: "Asia",
    icon: MapPin,
    description: "Asian markets and regional events",
    color: "text-warning",
    events: [
      {
        id: 30,
        title: "China GDP growth exceeds 5% in 2025?",
        category: "Economy",
        votingDeadline: "Dec 25, 2024",
        resultDeadline: "Apr 15, 2025",
        participants: 5432,
        xpReward: 800,
        cryptoReward: "800 USDC",
        isVotingClosed: false,
      },
      {
        id: 31,
        title: "India population to officially surpass China?",
        category: "Demographics",
        votingDeadline: "Jun 1, 2025",
        resultDeadline: "Aug 1, 2025",
        participants: 7621,
        xpReward: 850,
        cryptoReward: "850 USDC",
        isVotingClosed: false,
      },
    ],
  },
  {
    id: "africa",
    name: "Africa",
    icon: MapPin,
    description: "African markets and developments",
    color: "text-destructive",
    events: [
      {
        id: 40,
        title: "Nigeria oil production to increase 20% in 2025?",
        category: "Energy",
        votingDeadline: "Jan 15, 2025",
        resultDeadline: "Jun 30, 2025",
        participants: 2145,
        xpReward: 550,
        cryptoReward: "550 USDC",
        isVotingClosed: false,
      },
      {
        id: 41,
        title: "South Africa to adopt renewable energy targets?",
        category: "Environment",
        votingDeadline: "Mar 1, 2025",
        resultDeadline: "May 15, 2025",
        participants: 1876,
        xpReward: 500,
        cryptoReward: "500 USDC",
        isVotingClosed: false,
      },
    ],
  },
];

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState("global");

  const activeCategory = categories.find((cat) => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Explore by <span className="bg-gradient-primary bg-clip-text text-transparent">Region</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dive into local and global prediction markets tailored to your interests
            </p>
          </div>

          {/* Category Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`bg-gradient-card border rounded-xl p-6 transition-all duration-300 text-left ${
                    isActive
                      ? "border-primary shadow-glow scale-105"
                      : "border-border hover:border-primary/50 hover:shadow-card"
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${isActive ? category.color : "text-muted-foreground"}`} />
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                  <div className="mt-3 text-sm font-medium text-primary">
                    {category.events.length} events
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category Events */}
          {activeCategory && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{activeCategory.name} Markets</h2>
                  <p className="text-muted-foreground">{activeCategory.description}</p>
                </div>
                <Button variant="gradient">
                  Create Event in {activeCategory.name}
                </Button>
              </div>

              {activeCategory.events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCategory.events.map((event) => (
                    <EventCard key={event.id} {...event} />
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-card border border-border rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to create a prediction market in {activeCategory.name}!
                  </p>
                  <Button variant="gradient">
                    Create First Event
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
