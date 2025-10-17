import {
  Aptos,
  Account,
  Network,
  InputEntryFunctionData,
  TransactionWorkerEventsEnum,
} from "@aptos-labs/ts-sdk";
import { DEFAULT_NETWORK } from "../config/network";
import {
  PredictionEvent,
  Vote,
  CreateEventParams,
  VoteParams,
  ClaimRewardsParams,
  UserStats,
  CONTRACT_FUNCTIONS,
  CONTRACT_ADDRESSES,
} from "../types";

export class PredictionMarketContract {
  private aptos: Aptos;
  private network: Network;

  constructor(network: Network = DEFAULT_NETWORK) {
    this.aptos = new Aptos({ network });
    this.network = network;
  }

  // Create a new prediction event
  async createEvent(
    account: Account,
    params: CreateEventParams
  ): Promise<string> {
    try {
      const payload: InputEntryFunctionData = {
        function: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::${CONTRACT_FUNCTIONS.CREATE_EVENT}`,
        typeArguments: [],
        functionArguments: [
          params.title,
          params.description,
          params.category,
          params.region,
          params.votingDeadline,
          params.resultDeadline,
          params.resolutionCriteria,
          params.dataSources,
          params.xpReward,
          params.aptReward,
        ],
      };

      const transaction = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: payload,
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: account,
        transaction,
      });

      const response = await this.aptos.transaction.submit({
        transaction: signedTx,
      });

      await this.aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return response.hash;
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Vote on an event
  async vote(
    account: Account,
    params: VoteParams
  ): Promise<string> {
    try {
      const payload: InputEntryFunctionData = {
        function: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::${CONTRACT_FUNCTIONS.VOTE}`,
        typeArguments: [],
        functionArguments: [params.eventId, params.prediction],
      };

      const transaction = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: payload,
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: account,
        transaction,
      });

      const response = await this.aptos.transaction.submit({
        transaction: signedTx,
      });

      await this.aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return response.hash;
    } catch (error) {
      console.error("Error voting:", error);
      throw new Error(`Failed to vote: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Claim rewards for a specific event
  async claimRewards(
    account: Account,
    params: ClaimRewardsParams
  ): Promise<string> {
    try {
      const payload: InputEntryFunctionData = {
        function: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::${CONTRACT_FUNCTIONS.CLAIM_REWARDS}`,
        typeArguments: [],
        functionArguments: [params.eventId],
      };

      const transaction = await this.aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: payload,
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: account,
        transaction,
      });

      const response = await this.aptos.transaction.submit({
        transaction: signedTx,
      });

      await this.aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return response.hash;
    } catch (error) {
      console.error("Error claiming rewards:", error);
      throw new Error(`Failed to claim rewards: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Get all events
  async getAllEvents(): Promise<PredictionEvent[]> {
    try {
      const events = await this.aptos.query indexer({
        query: {
          where: {
            move_function: {
              module_address: {
                _eq: CONTRACT_ADDRESSES.PREDICTION_MARKET,
              },
              module_name: { _eq: "prediction_market" },
              function_name: { _eq: "create_event" },
            },
          },
        },
      });

      // Parse and transform the events data
      return this.parseEventsData(events);
    } catch (error) {
      console.error("Error fetching all events:", error);
      return [];
    }
  }

  // Get events by category
  async getEventsByCategory(category: string): Promise<PredictionEvent[]> {
    try {
      const allEvents = await this.getAllEvents();
      return allEvents.filter(event => event.category === category);
    } catch (error) {
      console.error("Error fetching events by category:", error);
      return [];
    }
  }

  // Get events by region
  async getEventsByRegion(region: string): Promise<PredictionEvent[]> {
    try {
      const allEvents = await this.getAllEvents();
      return allEvents.filter(event => event.region === region);
    } catch (error) {
      console.error("Error fetching events by region:", error);
      return [];
    }
  }

  // Get user's votes
  async getUserVotes(userAddress: string): Promise<Vote[]> {
    try {
      const votes = await this.aptos.query indexer({
        query: {
          where: {
            account_address: { _eq: userAddress },
            move_function: {
              module_address: {
                _eq: CONTRACT_ADDRESSES.PREDICTION_MARKET,
              },
              module_name: { _eq: "prediction_market" },
              function_name: { _eq: "vote" },
            },
          },
        },
      });

      return this.parseVotesData(votes);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      return [];
    }
  }

  // Get user statistics
  async getUserStats(userAddress: string): Promise<UserStats | null> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: userAddress,
      });

      const userStatsResource = resources.find(
        (resource) =>
          resource.type === `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::UserStats`
      );

      if (!userStatsResource) {
        return null;
      }

      return this.parseUserStatsData(userStatsResource.data as any);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
  }

  // Get specific event details
  async getEvent(eventId: string): Promise<PredictionEvent | null> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress: CONTRACT_ADDRESSES.PREDICTION_MARKET,
      });

      const eventsResource = resources.find(
        (resource) =>
          resource.type === `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::Events`
      );

      if (!eventsResource) {
        return null;
      }

      const eventsData = eventsResource.data as any;
      const eventData = eventsData.events.find((event: any) => event.id === eventId);

      return eventData ? this.parseEventData(eventData) : null;
    } catch (error) {
      console.error("Error fetching event:", error);
      return null;
    }
  }

  // Helper methods to parse blockchain data
  private parseEventsData(events: any[]): PredictionEvent[] {
    return events.map(event => this.parseEventData(event));
  }

  private parseEventData(event: any): PredictionEvent {
    return {
      id: event.data.event_id,
      creator: event.data.creator,
      title: event.data.title,
      description: event.data.description,
      category: event.data.category,
      region: event.data.region,
      votingDeadline: event.data.voting_deadline,
      resultDeadline: event.data.result_deadline,
      resolutionCriteria: event.data.resolution_criteria,
      dataSources: event.data.data_sources,
      isVotingClosed: event.data.is_voting_closed,
      isResolved: event.data.is_resolved,
      outcome: event.data.outcome,
      totalVotes: event.data.total_votes,
      yesVotes: event.data.yes_votes,
      noVotes: event.data.no_votes,
      xpReward: event.data.xp_reward,
      aptReward: event.data.apt_reward,
      created: event.data.created_at,
    };
  }

  private parseVotesData(votes: any[]): Vote[] {
    return votes.map(vote => ({
      voter: vote.data.voter,
      eventId: vote.data.event_id,
      prediction: vote.data.prediction,
      timestamp: vote.data.timestamp,
      claimedRewards: vote.data.claimed_rewards,
    }));
  }

  private parseUserStatsData(data: any): UserStats {
    return {
      address: data.address,
      totalXP: data.total_xp,
      totalEarned: data.total_earned,
      totalVotes: data.total_votes,
      correctPredictions: data.correct_predictions,
      accuracy: data.accuracy,
      level: data.level,
      createdEvents: data.created_events,
    };
  }

  // Get transaction status
  async getTransactionStatus(txHash: string): Promise<{
    success: boolean;
    status: string;
    gasUsed?: number;
    events?: any[];
  }> {
    try {
      const tx = await this.aptos.getTransactionByHash({
        transactionHash: txHash,
      });

      return {
        success: tx.success || false,
        status: tx.vm_status || "unknown",
        gasUsed: tx.gas_used ? Number(tx.gas_used) : undefined,
        events: tx.events || [],
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return {
        success: false,
        status: "failed",
      };
    }
  }
}