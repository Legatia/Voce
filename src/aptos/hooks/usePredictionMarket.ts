import { useState, useEffect, useCallback } from "react";
import { useAptosWallet } from "./useAptosWallet";
import { TransactionService } from "../utils/transactions";
import {
  PredictionEvent,
  Vote,
  UserStats,
  CreateEventParams,
  VoteParams,
  ClaimRewardsParams,
} from "../types";

interface UsePredictionMarketReturn {
  // Data
  events: PredictionEvent[];
  userVotes: Vote[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createEvent: (params: CreateEventParams) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  vote: (params: VoteParams) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  claimRewards: (params: ClaimRewardsParams) => Promise<{ success: boolean; txHash?: string; error?: string }>;

  // Data fetching
  refreshEvents: () => Promise<void>;
  refreshUserVotes: () => Promise<void>;
  refreshUserStats: () => Promise<void>;

  // Filtering
  getEventsByCategory: (category: string) => PredictionEvent[];
  getEventsByRegion: (region: string) => PredictionEvent[];
  getEventById: (eventId: string) => PredictionEvent | undefined;
  getUserVoteForEvent: (eventId: string) => Vote | undefined;
}

export const usePredictionMarket = (): UsePredictionMarketReturn => {
  const { account, network } = useAptosWallet();
  const [events, setEvents] = useState<PredictionEvent[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create transaction service instance
  const transactionService = new TransactionService(network);

  // Load initial data
  useEffect(() => {
    if (account) {
      refreshAllData();
    } else {
      // Load public events even without wallet connection
      refreshEvents();
    }
  }, [account, network]);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        refreshEvents(),
        account ? refreshUserVotes() : Promise.resolve(),
        account ? refreshUserStats() : Promise.resolve(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const refreshEvents = useCallback(async () => {
    try {
      const fetchedEvents = await transactionService.getAllEvents();
      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Error refreshing events:", err);
      setError("Failed to load events");
    }
  }, []);

  const refreshUserVotes = useCallback(async () => {
    if (!account) return;

    try {
      const votes = await transactionService.getUserVotes(account.accountAddress.toString());
      setUserVotes(votes);
    } catch (err) {
      console.error("Error refreshing user votes:", err);
      setError("Failed to load user votes");
    }
  }, [account]);

  const refreshUserStats = useCallback(async () => {
    if (!account) return;

    try {
      const stats = await transactionService.getUserStats(account.accountAddress.toString());
      setUserStats(stats);
    } catch (err) {
      console.error("Error refreshing user stats:", err);
      setError("Failed to load user stats");
    }
  }, [account]);

  const createEvent = useCallback(async (params: CreateEventParams) => {
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate parameters
      const validation = transactionService.validateCreateEventParams(params);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      const result = await transactionService.createEvent(account, params);

      if (result.success) {
        // Refresh data after successful transaction
        await refreshAllData();
      }

      return {
        success: result.success,
        txHash: result.txHash,
        error: result.success ? undefined : "Transaction failed",
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create event";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [account, refreshAllData]);

  const vote = useCallback(async (params: VoteParams) => {
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate parameters
      const validation = transactionService.validateVoteParams(params);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      const result = await transactionService.vote(account, params);

      if (result.success) {
        // Refresh data after successful transaction
        await refreshAllData();
      }

      return {
        success: result.success,
        txHash: result.txHash,
        error: result.success ? undefined : "Transaction failed",
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to vote";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [account, refreshAllData]);

  const claimRewards = useCallback(async (params: ClaimRewardsParams) => {
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await transactionService.claimRewards(account, params);

      if (result.success) {
        // Refresh data after successful transaction
        await refreshAllData();
      }

      return {
        success: result.success,
        txHash: result.txHash,
        error: result.success ? undefined : "Transaction failed",
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to claim rewards";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [account, refreshAllData]);

  // Filtering utility functions
  const getEventsByCategory = useCallback((category: string) => {
    return events.filter(event => event.category === category);
  }, [events]);

  const getEventsByRegion = useCallback((region: string) => {
    return events.filter(event => event.region === region);
  }, [events]);

  const getEventById = useCallback((eventId: string) => {
    return events.find(event => event.id.toString() === eventId);
  }, [events]);

  const getUserVoteForEvent = useCallback((eventId: string) => {
    return userVotes.find(vote => vote.eventId.toString() === eventId);
  }, [userVotes]);

  return {
    // Data
    events,
    userVotes,
    userStats,
    isLoading,
    error,

    // Actions
    createEvent,
    vote,
    claimRewards,

    // Data fetching
    refreshEvents,
    refreshUserVotes,
    refreshUserStats,

    // Filtering
    getEventsByCategory,
    getEventsByRegion,
    getEventById,
    getUserVoteForEvent,
  };
};