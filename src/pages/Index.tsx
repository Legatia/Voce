import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventGrid from "@/components/EventGrid";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { ContractIntegrationTest } from "@/components/test/ContractIntegrationTest";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      {/* Contract Integration Test - Temporary */}
      <div className="container mx-auto py-8">
        <ContractIntegrationTest />
      </div>

      <EventGrid />
      <HowItWorks />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
