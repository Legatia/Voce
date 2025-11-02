import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { secureVotingService } from "@/aptos/services/secureVotingService";
import { financialSystemService } from "@/aptos/services/financialSystemService";

interface Vote {
  eventId: string;
  optionId: string;
  stake: number;
  timestamp: number;
  transactionHash?: string;
  commitmentHash?: string;
  salt?: string;
  isRevealed?: boolean;
}

interface VotingState {
  votes: Vote[];
  isProcessing: boolean;
  error: string | null;
  useSecureVoting: boolean;
  commitmentPhase: boolean;
  revealPhase: boolean;
}

interface OnChainVote {
  eventId: number;
  commitmentHash: Uint8Array;
  stakeAmount: number;
  salt: string;
  revealed: boolean;
  transactionHash: string;
}

export const useVoting = () => {
  const { isConnected, account, network } = useWallet();
  const [votingState, setVotingState] = useState<VotingState>({
    votes: [],
    isProcessing: false,
    error: null,
    useSecureVoting: process.env.NEXT_PUBLIC_ENABLE_SECURE_VOTING === "true",
    commitmentPhase: false,
    revealPhase: false,
  });

  // Initialize smart contract systems
  useEffect(() => {
    const initializeSystems = async () => {
      if (votingState.useSecureVoting && account) {
        try {
          const isSecureVotingInitialized = await secureVotingService.isSecureVotingInitialized();
          const isFinancialSystemInitialized = await financialSystemService.isFinancialSystemInitialized();

          console.log("Secure Voting Initialized:", isSecureVotingInitialized);
          console.log("Financial System Initialized:", isFinancialSystemInitialized);
        } catch (error) {
          console.error("Failed to initialize systems:", error);
        }
      }
    };

    initializeSystems();
  }, [votingState.useSecureVoting, account]);

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

  // Cast a vote using smart contracts
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
      let transactionHash: string;

      if (votingState.useSecureVoting) {
        // Use secure commit-reveal voting
        const salt = secureVotingService.generateSecureSalt();
        const commitmentHash = secureVotingService.generateCommitmentHash(
          parseInt(optionId),
          salt
        );

        // For demo, we'll use a mock event ID
        const numericEventId = parseInt(eventId.replace('event_', '')) || 1;

        // Place commitment on blockchain
        transactionHash = await secureVotingService.placeCommitment(
          account,
          numericEventId,
          parseInt(optionId),
          salt,
          stake
        );

        const newVote: Vote = {
          eventId,
          optionId,
          stake,
          timestamp: Date.now(),
          transactionHash,
          commitmentHash: Array.from(commitmentHash).toString(),
          salt,
          isRevealed: false,
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
      } else {
        // Legacy voting (fallback)
        transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

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
      }

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
  }, [isConnected, account, loadVotingHistory, saveVotingHistory, votingState.useSecureVoting]);

  // Reveal a vote (for secure voting)
  const revealVote = useCallback(async (
    eventId: string,
    optionId: string,
    salt: string
  ): Promise<string> => {
    if (!isConnected || !account || !votingState.useSecureVoting) {
      throw new Error("Secure voting not enabled or wallet not connected");
    }

    setVotingState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const numericEventId = parseInt(eventId.replace('event_', '')) || 1;

      // Reveal vote on blockchain
      const transactionHash = await secureVotingService.revealVote(
        account,
        numericEventId,
        parseInt(optionId),
        salt
      );

      // Update vote in history
      const currentVotes = loadVotingHistory();
      const updatedVotes = currentVotes.map(vote =>
        vote.eventId === eventId
          ? { ...vote, isRevealed: true }
          : vote
      );
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
  }, [isConnected, account, votingState.useSecureVoting, loadVotingHistory, saveVotingHistory]);

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
    useSecureVoting: votingState.useSecureVoting,
    commitmentPhase: votingState.commitmentPhase,
    revealPhase: votingState.revealPhase,

    // Actions
    castVote,
    revealVote,
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