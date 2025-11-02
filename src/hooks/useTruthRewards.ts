import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import {
  truthRewardsService,
  TruthEvent,
  RewardCalculation,
  CreateEventParams,
  REWARD_CONSTANTS
} from "@/aptos/services/truthRewards";

interface TruthRewardsState {
  events: TruthEvent[];
  userEvents: string[];
  claimableRewards: {
    winnerClaims: Array<{creator: string, eventId: number}>;
    creatorClaims: number[];
  };
  isProcessing: boolean;
  error: string | null;
  totalEarned: number;
}

export const useTruthRewards = () => {
  const { account } = useWallet();
  const [state, setState] = useState<TruthRewardsState>({
    events: [],
    userEvents: [],
    claimableRewards: { winnerClaims: [], creatorClaims: [] },
    isProcessing: false,
    error: null,
    totalEarned: 0,
  });

  // Create a new truth event
  const createTruthEvent = useCallback(async (
    params: CreateEventParams
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const txHash = await truthRewardsService.createTruthEvent(account, params);

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create event";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [account]);

  // Vote for an option
  const voteForOption = useCallback(async (
    eventCreator: string,
    eventId: number,
    optionIndex: number,
    amount: number
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const txHash = await truthRewardsService.voteForOption(
        account,
        eventCreator,
        eventId,
        optionIndex,
        amount
      );

      // Refresh events to update vote counts
      await loadEvents();

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to vote";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [account]);

  // Resolve an event (admin only)
  const resolveTruthEvent = useCallback(async (
    eventId: number,
    winningOption: number
  ): Promise<string> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const txHash = await truthRewardsService.resolveTruthEvent(eventId, winningOption);

      // Refresh events to update resolution status
      await loadEvents();

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resolve event";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Claim winner reward
  const claimWinnerReward = useCallback(async (
    eventCreator: string,
    eventId: number
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const txHash = await truthRewardsService.claimWinnerReward(account, eventCreator, eventId);

      // Refresh claimable rewards
      await loadClaimableRewards();
      await loadTotalEarned();

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to claim winner reward";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [account]);

  // Claim creator reward
  const claimCreatorReward = useCallback(async (
    eventId: number
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const txHash = await truthRewardsService.claimCreatorReward(account, eventId);

      // Refresh claimable rewards
      await loadClaimableRewards();
      await loadTotalEarned();

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to claim creator reward";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [account]);

  // Batch claim all rewards
  const batchClaimRewards = useCallback(async (): Promise<{
    successful: string[];
    failed: Array<{tx: string, error: string}>;
  }> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await truthRewardsService.batchClaimRewards(
        account,
        state.claimableRewards
      );

      // Refresh data after claiming
      await loadClaimableRewards();
      await loadTotalEarned();

      setState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to batch claim rewards";
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [account, state.claimableRewards]);

  // Load all events
  const loadEvents = useCallback(async () => {
    try {
      // This would load events from the contract
      // For now, we'll use a placeholder implementation
      setState(prev => ({ ...prev, events: [] }));
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }, []);

  // Load user's events
  const loadUserEvents = useCallback(async () => {
    if (!account?.accountAddress.toString()) return;

    try {
      const userEvents = await truthRewardsService.getCreatorEvents(
        account.accountAddress.toString()
      );
      setState(prev => ({ ...prev, userEvents }));
    } catch (error) {
      console.error("Failed to load user events:", error);
    }
  }, [account]);

  // Load claimable rewards
  const loadClaimableRewards = useCallback(async () => {
    if (!account?.accountAddress.toString()) return;

    try {
      // This would check which events the user can claim rewards from
      // For now, return empty arrays
      setState(prev => ({
        ...prev,
        claimableRewards: { winnerClaims: [], creatorClaims: [] }
      }));
    } catch (error) {
      console.error("Failed to load claimable rewards:", error);
    }
  }, [account]);

  // Load total earned
  const loadTotalEarned = useCallback(async () => {
    if (!account?.accountAddress.toString()) return;

    try {
      const totalEarned = await truthRewardsService.getUserTotalRewards(
        account.accountAddress.toString()
      );
      setState(prev => ({ ...prev, totalEarned }));
    } catch (error) {
      console.error("Failed to load total earned:", error);
    }
  }, [account]);

  // Get event details
  const getEventDetails = useCallback(async (eventId: number) => {
    try {
      return await truthRewardsService.getEventDetails(eventId);
    } catch (error) {
      console.error("Failed to get event details:", error);
      return null;
    }
  }, []);

  // Get reward calculation
  const getRewardCalculation = useCallback(async (eventId: number) => {
    try {
      return await truthRewardsService.getRewardCalculation(eventId);
    } catch (error) {
      console.error("Failed to get reward calculation:", error);
      return null;
    }
  }, []);

  // Check if user is winner
  const isWinner = useCallback(async (eventId: number, user?: string) => {
    const userAddress = user || account?.accountAddress.toString();
    if (!userAddress) return false;

    try {
      return await truthRewardsService.isWinner(eventId, userAddress);
    } catch (error) {
      console.error("Failed to check winner status:", error);
      return false;
    }
  }, [account]);

  // Calculate rewards locally (for preview)
  const calculateRewardsPreview = useCallback((
    totalPrizePool: number,
    numberOfWinners: number
  ): RewardCalculation => {
    return truthRewardsService.calculateRewardsLocally(totalPrizePool, numberOfWinners);
  }, []);

  // Get reward breakdown
  const getRewardBreakdown = useCallback(async (eventId: number) => {
    try {
      return await truthRewardsService.getRewardBreakdown(eventId);
    } catch (error) {
      console.error("Failed to get reward breakdown:", error);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize data when account changes
  useEffect(() => {
    if (account) {
      loadUserEvents();
      loadClaimableRewards();
      loadTotalEarned();
    }
  }, [account, loadUserEvents, loadClaimableRewards, loadTotalEarned]);

  return {
    // State
    events: state.events,
    userEvents: state.userEvents,
    claimableRewards: state.claimableRewards,
    isProcessing: state.isProcessing,
    error: state.error,
    totalEarned: state.totalEarned,

    // Actions
    createTruthEvent,
    voteForOption,
    resolveTruthEvent,
    claimWinnerReward,
    claimCreatorReward,
    batchClaimRewards,

    // Getters
    getEventDetails,
    getRewardCalculation,
    isWinner,
    calculateRewardsPreview,
    getRewardBreakdown,

    // Utilities
    clearError,

    // Constants
    REWARD_CONSTANTS,
  };
};