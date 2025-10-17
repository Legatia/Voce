import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventGrid from "@/components/EventGrid";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <EventGrid />
      <HowItWorks />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
