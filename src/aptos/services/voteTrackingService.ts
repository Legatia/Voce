import { Account, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";
import { secureVotingService } from "./secureVotingService";

// Contract configuration
const SECURE_VOTING_ADDRESS = import.meta.env.VITE_SECURE_VOTING_ADDRESS || "0x1";
const VOCE_ADMIN_ADDRESS = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "0x123";

// Interfaces for vote tracking
export interface VoteEventData {
  timestamp: number;
  voter: string;
  optionIndex: number;
  transactionHash: string;
  isCommitment: boolean;
  isReveal: boolean;
}

export interface VotingStatistics {
  eventId: number;
  totalCommitments: number;
  totalReveals: number;
  uniqueVoters: number;
  timeStart: number;
  timeEnd: number;
  optionDistribution: Array<{
    optionIndex: number;
    votes: number;
    percentage: number;
  }>;
}

export interface VoteTrackingData {
  eventId: number;
  eventTitle: string;
  dataPoints: Array<{
    timestamp: number;
    time: string;
    totalVotes: number;
    totalReveals: number;
    participants: number;
    options: {
      [optionId: string]: {
        votes: number;
        percentage: number;
        cumulative: number;
      };
    };
  }>;
  statistics: VotingStatistics;
}

/**
 * Service for tracking voting data and transparency
 */
export class VoteTrackingService {
  private client: any;

  constructor(network: Network = Network.TESTNET) {
    this.client = createAptosClient(network);
  }

  /**
   * Get voting events data from smart contract events
   */
  async getVotingEventData(eventId: number): Promise<VoteEventData[]> {
    try {
      // In a real implementation, this would query the blockchain for all voting events
      // For now, we'll simulate with some realistic data

      const events: VoteEventData[] = [];

      // Get commit phase events
      const commitEvents = await this.getCommitEvents(eventId);
      events.push(...commitEvents);

      // Get reveal phase events
      const revealEvents = await this.getRevealEvents(eventId);
      events.push(...revealEvents);

      // Sort by timestamp
      return events.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Failed to get voting event data:", error);
      return [];
    }
  }

  /**
   * Get commit events from blockchain
   */
  private async getCommitEvents(eventId: number): Promise<VoteEventData[]> {
    try {
      // Query actual commit events from smart contract
      const eventFilter = {
        event_type: `${SECURE_VOTING_ADDRESS}::secure_voting::CommitEvent`
      };

      const events = await this.client.getEvents({
        event_type: `${SECURE_VOTING_ADDRESS}::secure_voting::CommitEvent`
      });

      return events
        .filter(event => Number(event.data.event_id) === eventId)
        .map(event => ({
          voter: event.data.voter as string,
          timestamp: Number(event.data.timestamp),
          transactionHash: event.transaction_hash,
          blockHeight: event.version,
        }));
    } catch (error) {
      console.error("Failed to get commit events:", error);
      return [];
    }
  }

  /**
   * Get reveal events from blockchain
   */
  private async getRevealEvents(eventId: number): Promise<VoteEventData[]> {
    try {
      // Query actual reveal events from smart contract
      const events = await this.client.getEvents({
        event_type: `${SECURE_VOTING_ADDRESS}::secure_voting::RevealEvent`
      });

      return events
        .filter(event => Number(event.data.event_id) === eventId)
        .map(event => ({
          voter: event.data.voter as string,
          timestamp: Number(event.data.timestamp),
          transactionHash: event.transaction_hash,
          blockHeight: event.version,
        }));
    } catch (error) {
      console.error("Failed to get reveal events:", error);
      return [];
    }
  }

  /**
   * Process voting events into time-series data for graph
   */
  async processVoteTrackingData(eventId: number, eventTitle: string, options: Array<{id: string; text: string}>): Promise<VoteTrackingData> {
    try {
      // Get raw voting events
      const events = await this.getVotingEventData(eventId);

      if (events.length === 0) {
        return this.createEmptyTrackingData(eventId, eventTitle, options);
      }

      // Sort events by timestamp
      const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);

      // Create time buckets (e.g., every 4 hours)
      const bucketSize = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
      const startTime = sortedEvents[0].timestamp;
      const endTime = sortedEvents[sortedEvents.length - 1].timestamp;

      const dataPoints: VoteTrackingData['dataPoints'] = [];
      const optionMap = new Map(options.map((opt, index) => [opt.id, index]));

      // Initialize counters
      const optionVotes = new Map<number, number>();
      const uniqueVoters = new Set<string>();

      options.forEach((_, index) => {
        optionVotes.set(index, 0);
      });

      // Process events in time buckets
      for (let time = startTime; time <= endTime; time += bucketSize) {
        const bucketEnd = time + bucketSize;

        // Find events in this time bucket
        const bucketEvents = sortedEvents.filter(
          event => event.timestamp >= time && event.timestamp < bucketEnd
        );

        // Process reveals only (commitments are hidden until reveal)
        const revealsInBucket = bucketEvents.filter(event => event.isReveal);

        for (const event of revealsInBucket) {
          uniqueVoters.add(event.voter);
          if (event.optionIndex < options.length) {
            const currentVotes = optionVotes.get(event.optionIndex) || 0;
            optionVotes.set(event.optionIndex, currentVotes + 1);
          }
        }

        // Calculate totals and percentages
        const totalVotes = Array.from(optionVotes.values()).reduce((sum, votes) => sum + votes, 0);

        const optionsData: {[optionId: string]: {votes: number; percentage: number; cumulative: number}} = {};

        options.forEach((option, index) => {
          const votes = optionVotes.get(index) || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

          optionsData[option.id] = {
            votes,
            percentage,
            cumulative: votes // For now, same as votes
          };
        });

        // Add data point if there's activity
        if (revealsInBucket.length > 0 || dataPoints.length === 0) {
          dataPoints.push({
            timestamp: time,
            time: new Date(time).toLocaleString(),
            totalVotes,
            totalReveals: totalVotes,
            participants: uniqueVoters.size,
            options: optionsData
          });
        }
      }

      // Calculate final statistics
      const finalOptionVotes = new Map<number, number>();
      const finalVoters = new Set<string>();

      sortedEvents.filter(event => event.isReveal).forEach(event => {
        finalVoters.add(event.voter);
        if (event.optionIndex < options.length) {
          const currentVotes = finalOptionVotes.get(event.optionIndex) || 0;
          finalOptionVotes.set(event.optionIndex, currentVotes + 1);
        }
      });

      const totalFinalVotes = Array.from(finalOptionVotes.values()).reduce((sum, votes) => sum + votes, 0);
      const totalCommits = sortedEvents.filter(event => event.isCommitment).length;
      const totalReveals = sortedEvents.filter(event => event.isReveal).length;

      const optionDistribution = options.map((option, index) => ({
        optionIndex: index,
        votes: finalOptionVotes.get(index) || 0,
        percentage: totalFinalVotes > 0 ? ((finalOptionVotes.get(index) || 0) / totalFinalVotes) * 100 : 0
      }));

      const statistics: VotingStatistics = {
        eventId,
        totalCommitments: totalCommits,
        totalReveals: totalReveals,
        uniqueVoters: finalVoters.size,
        timeStart: startTime,
        timeEnd: endTime,
        optionDistribution
      };

      return {
        eventId,
        eventTitle,
        dataPoints,
        statistics
      };

    } catch (error) {
      console.error("Failed to process vote tracking data:", error);
      return this.createEmptyTrackingData(eventId, eventTitle, options);
    }
  }

  /**
   * Create empty tracking data for events with no activity
   */
  private createEmptyTrackingData(eventId: number, eventTitle: string, options: Array<{id: string; text: string}>): VoteTrackingData {
    const now = Date.now();
    const optionsData: {[optionId: string]: {votes: number; percentage: number; cumulative: number}} = {};

    options.forEach(option => {
      optionsData[option.id] = {
        votes: 0,
        percentage: 0,
        cumulative: 0
      };
    });

    return {
      eventId,
      eventTitle,
      dataPoints: [{
        timestamp: now,
        time: new Date(now).toLocaleString(),
        totalVotes: 0,
        totalReveals: 0,
        participants: 0,
        options: optionsData
      }],
      statistics: {
        eventId,
        totalCommitments: 0,
        totalReveals: 0,
        uniqueVoters: 0,
        timeStart: now,
        timeEnd: now,
        optionDistribution: options.map((option, index) => ({
          optionIndex: index,
          votes: 0,
          percentage: 0
        }))
      }
    };
  }

  /**
   * Get real-time voting statistics
   */
  async getVotingStatistics(eventId: number): Promise<VotingStatistics | null> {
    try {
      // In production, this would query the smart contract for current statistics
      const events = await this.getVotingEventData(eventId);

      if (events.length === 0) return null;

      const commits = events.filter(e => e.isCommitment).length;
      const reveals = events.filter(e => e.isReveal).length;
      const uniqueVoters = new Set(events.filter(e => e.isReveal).map(e => e.voter)).size;

      const optionCounts = new Map<number, number>();
      events.filter(e => e.isReveal).forEach(event => {
        const count = optionCounts.get(event.optionIndex) || 0;
        optionCounts.set(event.optionIndex, count + 1);
      });

      const totalReveals = Array.from(optionCounts.values()).reduce((sum, count) => sum + count, 0);

      const optionDistribution = Array.from(optionCounts.entries()).map(([optionIndex, votes]) => ({
        optionIndex,
        votes,
        percentage: totalReveals > 0 ? (votes / totalReveals) * 100 : 0
      }));

      return {
        eventId,
        totalCommitments: commits,
        totalReveals: reveals,
        uniqueVoters,
        timeStart: events[0].timestamp,
        timeEnd: events[events.length - 1].timestamp,
        optionDistribution
      };
    } catch (error) {
      console.error("Failed to get voting statistics:", error);
      return null;
    }
  }

  /**
   * Export voting data for transparency reports
   */
  async exportVotingData(eventId: number): Promise<string> {
    try {
      const data = await this.processVoteTrackingData(eventId, "Event", []);

      // Convert to CSV format
      const headers = [
        'Timestamp',
        'Total Votes',
        'Total Reveals',
        'Participants',
        ...Object.keys(data.dataPoints[0]?.options || {}).map(optId => `${optId} Votes`),
        ...Object.keys(data.dataPoints[0]?.options || {}).map(optId => `${optId} Percentage`)
      ];

      const csvRows = [headers.join(',')];

      data.dataPoints.forEach(point => {
        const row = [
          new Date(point.timestamp).toISOString(),
          point.totalVotes.toString(),
          point.totalReveals.toString(),
          point.participants.toString(),
          ...Object.values(point.options).map(opt => opt.votes.toString()),
          ...Object.values(point.options).map(opt => opt.percentage.toFixed(2))
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error("Failed to export voting data:", error);
      return '';
    }
  }
}

// Create singleton instance
export const voteTrackingService = new VoteTrackingService();

// Export utility functions
export const getVoteTrackingData = async (eventId: number, eventTitle: string, options: Array<{id: string; text: string}>): Promise<VoteTrackingData> => {
  return await voteTrackingService.processVoteTrackingData(eventId, eventTitle, options);
};

export const getVotingStatistics = async (eventId: number): Promise<VotingStatistics | null> => {
  return await voteTrackingService.getVotingStatistics(eventId);
};

export const exportVotingData = async (eventId: number): Promise<string> => {
  return await voteTrackingService.exportVotingData(eventId);
};