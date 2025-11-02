import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import VoteTrackingGraph from "@/components/voting/VoteTrackingGraph";
import {
  BarChart3,
  Eye,
  Download,
  TrendingUp,
  Shield,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";

const VotingTransparencyDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState<"ended" | "active">("ended");

  // Demo event that has ended (will show the graph)
  const endedEvent = {
    id: "demo_1",
    title: "Will AI Surpass Human Intelligence by 2030?",
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    revealDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    options: [
      { id: "yes", text: "Yes - AGI will be achieved" },
      { id: "no", text: "No - Human intelligence remains superior" },
      { id: "uncertain", text: "Uncertain - Partial progress only" }
    ],
    status: "resolved" as const,
    winningOption: "no",
    totalParticipants: 1247
  };

  // Demo event that is still active (won't show the graph yet)
  const activeEvent = {
    id: "demo_2",
    title: "Will Bitcoin Reach $100k by End of 2024?",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    revealDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    options: [
      { id: "yes", text: "Yes - $100k+ achieved" },
      { id: "no", text: "No - Falls short of $100k" }
    ],
    status: "active" as const,
    commitPhase: true,
    revealPhase: false
  };

  const currentEvent = selectedDemo === "ended" ? endedEvent : activeEvent;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Voting Transparency Demo
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Experience real-time vote tracking and complete transparency in our decentralized voting system.
              See how blockchain technology ensures every vote is accounted for and verifiable.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <Button
                variant={selectedDemo === "ended" ? "default" : "outline"}
                onClick={() => setSelectedDemo("ended")}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ended Voting (With Graph)
              </Button>
              <Button
                variant={selectedDemo === "active" ? "default" : "outline"}
                onClick={() => setSelectedDemo("active")}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Active Voting (Hidden Until End)
              </Button>
            </div>
          </div>

          {/* Status Banner */}
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    selectedDemo === "ended" ? "bg-green-500/10" : "bg-blue-500/10"
                  }`}>
                    {selectedDemo === "ended" ? (
                      <Eye className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedDemo === "ended" ? "Voting Period Ended" : "Voting in Progress"}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedDemo === "ended"
                        ? "All votes have been revealed and results are now visible with complete transparency."
                        : "Votes are currently hidden to prevent front-running. Results will be visible after the deadline."
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Participants</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {currentEvent.totalParticipants || "Hidden"}
                    </div>
                  </div>
                  <Badge
                    variant={selectedDemo === "ended" ? "default" : "secondary"}
                    className="text-sm px-4 py-2"
                  >
                    {selectedDemo === "ended" ? "Results Available" : "Vote Hidden"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{currentEvent.title}</CardTitle>
                  <CardDescription>
                    {selectedDemo === "ended"
                      ? "This voting event has concluded. View the complete voting history and transparency data below."
                      : "This voting event is currently active. Vote counts are hidden until the deadline to ensure fairness."
                    }
                  </CardDescription>
                </div>

                {selectedDemo === "ended" && currentEvent.winningOption && (
                  <Badge variant="default" className="bg-green-500">
                    Winner: {currentEvent.options.find(opt => opt.id === currentEvent.winningOption)?.text}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Voting Deadline</div>
                  <div className="font-semibold">
                    {new Date(currentEvent.deadline).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Reveal Deadline</div>
                  <div className="font-semibold">
                    {new Date(currentEvent.revealDeadline).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Options</div>
                  <div className="font-semibold">{currentEvent.options.length}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-semibold">Voting Options:</h4>
                {currentEvent.options.map((option, index) => (
                  <div key={option.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`}
                           style={{
                             backgroundColor: index === 0 ? "#3b82f6" :
                                            index === 1 ? "#10b981" : "#f59e0b"
                           }} />
                      <span className="font-medium">{option.text}</span>
                    </div>
                    {selectedDemo === "ended" && currentEvent.winningOption === option.id && (
                      <Badge variant="default" className="bg-green-500">Winner</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vote Tracking Graph - Only shows for ended voting */}
          {selectedDemo === "ended" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Vote Tracking & Transparency</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Below is the complete voting history showing how votes were revealed over time.
                  This demonstrates the transparency and auditability of our blockchain-based voting system.
                </p>
              </div>

              <VoteTrackingGraph
                event={endedEvent}
                onShowDetails={() => {
                  console.log("Show detailed analysis");
                }}
              />

              {/* Transparency Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-blue-600" />
                      <CardTitle className="text-lg">Cryptographic Security</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Every vote is secured with keccak256 hashing and cryptographic commitments,
                      ensuring no tampering or front-running.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <CardTitle className="text-lg">Real-Time Tracking</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Vote reveals are tracked in real-time on the blockchain, providing complete
                      transparency and auditability of the entire voting process.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Download className="w-6 h-6 text-purple-600" />
                      <CardTitle className="text-lg">Data Export</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All voting data can be exported for independent verification and analysis,
                      ensuring complete transparency and trust in the results.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Active Voting Message */}
          {selectedDemo === "active" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Voting in Progress</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  This voting event is currently active. Vote counts are hidden until the deadline to prevent
                  front-running and ensure fair voting. The transparency graph will appear here once voting ends.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Votes Hidden Until Deadline
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure Voting Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Experience Decentralized Voting</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our blockchain-based voting system ensures complete transparency, security, and auditability.
                Every vote is cryptographically secured and verifiable on the blockchain.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" className="flex items-center gap-2">
                  Start Voting
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  Learn More
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VotingTransparencyDemo;