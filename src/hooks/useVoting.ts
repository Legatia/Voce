import { useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";

interface Vote {
  eventId: string;
  optionId: string;
  stake: number;
  timestamp: number;
  transactionHash?: string;
}

interface VotingState {
  votes: Vote[];
  isProcessing: boolean;
  error: string | null;
}

export const useVoting = () => {
  const { isConnected, account, network } = useWallet();
  const [votingState, setVotingState] = useState<VotingState>({
    votes: [],
    isProcessing: false,
    error: null,
  });

  // Load user's voting history from localStorage
  const loadVotingHistory = useCallback(() => {
    if (!account?.accountAddress.toString()) return [];

    try {
      const key = `voting_history_${account.accountAddress.toString()}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load voting history:", error);
      return [];
    }
  }, [account]);

  // Save voting history to localStorage
  const saveVotingHistory = useCallback((votes: Vote[]) => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `voting_history_${account.accountAddress.toString()}`;
      localStorage.setItem(key, JSON.stringify(votes));
    } catch (error) {
      console.error("Failed to save voting history:", error);
    }
  }, [account]);

  // Cast a vote
  const castVote = useCallback(async (
    eventId: string,
    optionId: string,
    stake: number
  ): Promise<string> => {
    if (!isConnected || !account) {
      throw new Error("Wallet not connected");
    }

    setVotingState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Simulate blockchain transaction
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newVote: Vote = {
        eventId,
        optionId,
        stake,
        timestamp: Date.now(),
        transactionHash,
      };

      // Update voting history
      const currentVotes = loadVotingHistory();
      const updatedVotes = [...currentVotes, newVote];
      saveVotingHistory(updatedVotes);

      setVotingState(prev => ({
        ...prev,
        votes: updatedVotes,
        isProcessing: false,
      }));

      return transactionHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setVotingState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [isConnected, account, loadVotingHistory, saveVotingHistory]);

  // Check if user has voted on an event
  const hasVoted = useCallback((eventId: string): boolean => {
    const votes = loadVotingHistory();
    return votes.some(vote => vote.eventId === eventId);
  }, [loadVotingHistory]);

  // Get user's vote for an event
  const getUserVote = useCallback((eventId: string): Vote | null => {
    const votes = loadVotingHistory();
    return votes.find(vote => vote.eventId === eventId) || null;
  }, [loadVotingHistory]);

  // Calculate total staked by user
  const getTotalStaked = useCallback((): number => {
    const votes = loadVotingHistory();
    return votes.reduce((total, vote) => total + vote.stake, 0);
  }, [loadVotingHistory]);

  // Get voting statistics
  const getVotingStats = useCallback(() => {
    const votes = loadVotingHistory();
    return {
      totalVotes: votes.length,
      totalStaked: getTotalStaked(),
      averageStake: votes.length > 0 ? getTotalStaked() / votes.length : 0,
    };
  }, [loadVotingHistory, getTotalStaked]);

  // Clear voting history (for testing/reset)
  const clearVotingHistory = useCallback(() => {
    if (!account?.accountAddress.toString()) return;

    try {
      const key = `voting_history_${account.accountAddress.toString()}`;
      localStorage.removeItem(key);
      setVotingState(prev => ({ ...prev, votes: [] }));
    } catch (error) {
      console.error("Failed to clear voting history:", error);
    }
  }, [account]);

  // Initialize voting history on component mount
  const initializeVoting = useCallback(() => {
    const votes = loadVotingHistory();
    setVotingState(prev => ({ ...prev, votes }));
  }, [loadVotingHistory]);

  return {
    // State
    votes: votingState.votes,
    isProcessing: votingState.isProcessing,
    error: votingState.error,

    // Actions
    castVote,
    hasVoted,
    getUserVote,
    getVotingStats,
    clearVotingHistory,
    initializeVoting,

    // Computed
    isConnected,
    totalStaked: getTotalStaked(),
  };
};