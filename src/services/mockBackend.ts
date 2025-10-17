import { useWallet } from "@/contexts/WalletContext";
import { useVoting } from "@/hooks/useVoting";
import { useRewards } from "@/hooks/useRewards";

interface MockEvent {
  id: string;
  title: string;
  votingDeadline: Date;
  resolutionDeadline?: Date;
  isResolved: boolean;
  winningOption?: string;
  participants: string[];
}

interface MockBackendService {
  // Event management
  resolveEvent: (eventId: string) => Promise<void>;
  createEvent: (eventData: any) => Promise<string>;

  // Reward distribution
  distributeRewards: (eventId: string) => Promise<void>;

  // Simulation
  simulateEventProgression: () => void;
  autoResolveEvents: () => void;
}

class MockBackend implements MockBackendService {
  private events: Map<string, MockEvent> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMockEvents();
    this.startAutoResolution();
  }

  private initializeMockEvents() {
    // Initialize some mock events
    const mockEvents = [
      {
        id: "1",
        title: "Bitcoin will reach $100k by end of 2024",
        votingDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        resolutionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        isResolved: false,
        participants: []
      },
      {
        id: "2",
        title: "Ethereum 2.0 staking will exceed 10M ETH",
        votingDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        resolutionDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        isResolved: false,
        participants: []
      }
    ];

    mockEvents.forEach(event => {
      this.events.set(event.id, event);
    });
  }

  private startAutoResolution() {
    // Check for events to resolve every 30 seconds
    this.intervalId = setInterval(() => {
      this.autoResolveEvents();
    }, 30000);
  }

  async resolveEvent(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    if (event.isResolved) {
      throw new Error(`Event ${eventId} is already resolved`);
    }

    // Simulate determining the winner (random for demo)
    const options = ["yes", "no"];
    const winningOption = options[Math.floor(Math.random() * options.length)];

    event.winningOption = winningOption;
    event.isResolved = true;

    console.log(`Event ${eventId} resolved. Winner: ${winningOption}`);

    // Distribute rewards
    await this.distributeRewards(eventId);
  }

  async createEvent(eventData: any): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newEvent: MockEvent = {
      id: eventId,
      title: eventData.title,
      votingDeadline: new Date(eventData.votingDeadline),
      resolutionDeadline: eventData.resolutionDeadline ? new Date(eventData.resolutionDeadline) : undefined,
      isResolved: false,
      participants: []
    };

    this.events.set(eventId, newEvent);
    console.log(`Created new event: ${eventId}`);

    return eventId;
  }

  async distributeRewards(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event || !event.isResolved || !event.winningOption) {
      return;
    }

    console.log(`Distributing rewards for event ${eventId}`);
    console.log(`Winning option: ${event.winningOption}`);
    console.log(`Participants: ${event.participants.length}`);

    // In a real implementation, this would:
    // 1. Calculate XP rewards for majority matching
    // 2. Calculate crypto rewards for correct predictions
    // 3. Update user stats
    // 4. Emit events for frontend updates

    // For now, we'll just log the distribution
    event.participants.forEach(participant => {
      console.log(`Participant ${participant} would receive rewards`);
    });
  }

  simulateEventProgression() {
    // Speed up time for testing (1 minute = 1 hour in simulation)
    const now = new Date();

    this.events.forEach((event, id) => {
      const timeToDeadline = event.votingDeadline.getTime() - now.getTime();

      if (timeToDeadline <= 0 && !event.isResolved) {
        console.log(`Event ${id} voting deadline reached`);
        this.resolveEvent(id);
      }
    });
  }

  autoResolveEvents() {
    const now = new Date();

    this.events.forEach((event, id) => {
      // Check if voting deadline has passed
      if (event.votingDeadline <= now && !event.isResolved) {
        console.log(`Auto-resolving event ${id}: ${event.title}`);
        this.resolveEvent(id);
      }
    });
  }

  // Utility methods
  getEvent(eventId: string): MockEvent | undefined {
    return this.events.get(eventId);
  }

  getAllEvents(): MockEvent[] {
    return Array.from(this.events.values());
  }

  getActiveEvents(): MockEvent[] {
    const now = new Date();
    return Array.from(this.events.values()).filter(
      event => event.votingDeadline > now && !event.isResolved
    );
  }

  getResolvedEvents(): MockEvent[] {
    return Array.from(this.events.values()).filter(event => event.isResolved);
  }

  // Add participant to event
  addParticipant(eventId: string, participantAddress: string): void {
    const event = this.events.get(eventId);
    if (event && !event.participants.includes(participantAddress)) {
      event.participants.push(participantAddress);
    }
  }

  // Cleanup
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Global mock backend instance
let mockBackendInstance: MockBackend | null = null;

export const getMockBackend = (): MockBackend => {
  if (!mockBackendInstance) {
    mockBackendInstance = new MockBackend();
  }
  return mockBackendInstance;
};

// Hook for using mock backend
export const useMockBackend = () => {
  const { account } = useWallet();
  const { votes } = useVoting();
  const { calculateEventRewards } = useRewards();

  const mockBackend = getMockBackend();

  // Register user votes with mock backend
  const registerVote = (eventId: string) => {
    if (account) {
      mockBackend.addParticipant(eventId, account.accountAddress.toString());
    }
  };

  // Simulate event resolution for testing
  const resolveEventForTesting = async (eventId: string) => {
    const event = mockBackend.getEvent(eventId);
    if (!event || !account) return;

    const userVote = votes.find(vote => vote.eventId === eventId);
    if (!userVote) return;

    // Simulate outcome (50% chance user is correct)
    const userIsCorrect = Math.random() > 0.5;
    const winningOption = userIsCorrect ? userVote.optionId : (userVote.optionId === "yes" ? "no" : "yes");

    // Calculate rewards
    const matchedMajority = Math.random() > 0.3; // 70% chance to match majority

    await calculateEventRewards(
      eventId,
      userVote.optionId,
      winningOption,
      userVote.stake,
      matchedMajority
    );

    // Mark event as resolved
    await mockBackend.resolveEvent(eventId);
  };

  return {
    mockBackend,
    registerVote,
    resolveEventForTesting,
    resolveEvent: mockBackend.resolveEvent.bind(mockBackend),
    createEvent: mockBackend.createEvent.bind(mockBackend),
    getActiveEvents: mockBackend.getActiveEvents.bind(mockBackend),
    getResolvedEvents: mockBackend.getResolvedEvents.bind(mockBackend),
    simulateEventProgression: mockBackend.simulateEventProgression.bind(mockBackend),
  };
};