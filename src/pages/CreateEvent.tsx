import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import CreateEventForm from "@/components/events/CreateEventForm";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEventCreated = (eventId: string) => {
    toast({
      title: "Success!",
      description: "Your event has been created and is now live.",
    });

    // Navigate to the event or back to home
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Belief Market</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Create Your <span className="bg-gradient-primary bg-clip-text text-transparent">Prediction Event</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Submit real-world events for the community to vote on. Earn rewards for accurate predictions!
            </p>
          </div>

          {/* Event Creation Form */}
          <CreateEventForm onSuccess={handleEventCreated} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateEvent;
