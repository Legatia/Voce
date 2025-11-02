import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { TrendingUp, Sparkles } from "lucide-react";
import { mockEvents } from "@/data/mockEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

const EventGrid = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(mockEvents);

  // Simulate loading events
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvents(mockEvents);
      setIsLoading(false);
    };

    loadEvents();
  }, []);

  const EventCardSkeleton = () => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="h-48 bg-muted relative">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live Prediction Markets
          </h2>
          <p className="text-xl text-muted-foreground">
            Vote on events across the globe. Hidden ratios until voting closes.
          </p>
        </div>

        <Tabs defaultValue="hot" className="mb-8">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border">
            <TabsTrigger value="hot" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Hot Events
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Sparkles className="w-4 h-4" />
              New Listed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <EventCardSkeleton key={index} />
                  ))}
                </>
              ) : (
                events.slice(0, 6).map((event) => (
                  <EventCard key={event.id} {...event} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <EventCardSkeleton key={index} />
                  ))}
                </>
              ) : (
                events.slice().reverse().slice(0, 6).map((event) => (
                  <EventCard key={event.id} {...event} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12">
          <Link to="/categories">
            <Button variant="gradient" size="lg">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventGrid;
