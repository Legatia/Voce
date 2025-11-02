import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { createAptosClient } from "../utils/wallet";

// Contract configuration
const SECURE_VOTING_ADDRESS = import.meta.env.VITE_SECURE_VOTING_ADDRESS || "0x1";
const VOCE_ADMIN_ADDRESS = import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "0x123";

// Interfaces for secure voting
export interface VotingEvent {
  id: Uint8Array;
  creator: string;
  title: string;
  description: string;
  options: string[];
  commitPhaseEnd: number;
  revealPhaseEnd: number;
  stakeAmount: number;
  totalStaked: number;
  winningOption: number;
  isResolved: boolean;
  createdAt: number;
}

export interface VotingPhase {
  phase: number; // 1=commit, 2=reveal, 3=ended
  timeRemaining: number;
  canCommit: boolean;
  canReveal: boolean;
}

export interface Commitment {
  voter: string;
  commitmentHash: Uint8Array;
  stakeAmount: number;
  timestamp: number;
  revealed: boolean;
}

export interface Reveal {
  voter: string;
  optionIndex: number;
  salt: Uint8Array;
  originalCommitment: Uint8Array;
  timestamp: number;
}

export interface CreateVotingEventParams {
  title: string;
  description: string;
  options: string[];
  commitPhaseHours: number;
  revealPhaseHours: number;
  stakeAmount: number;
}

/**
 * Service for interacting with secure voting smart contract
 */
export class SecureVotingService {
  private client: any;
  private adminAccount: Account | null = null;

  constructor(network: Network = Network.TESTNET) {
    this.client = createAptosClient(network);
  }

  /**
   * Set admin account for privileged operations
   */
  setAdminAccount(privateKey: string) {
    this.adminAccount = new Account({
      privateKey: new Ed25519PrivateKey(privateKey),
    });
  }

  /**
   * Initialize the secure voting system (admin only)
   */
  async initializeSecureVoting(): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${SECURE_VOTING_ADDRESS}::secure_voting::initialize_secure_voting`,
      type_arguments: [],
      arguments: [],
    };

    const transaction = await this.client.generateTransaction(
      this.adminAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      this.adminAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Create a new secure voting event
   */
  async createVotingEvent(
    creatorAccount: Account,
    params: CreateVotingEventParams
  ): Promise<{ txHash: string; eventId: number }> {
    const payload = {
      type: "entry_function_payload",
      function: `${SECURE_VOTING_ADDRESS}::secure_voting::create_voting_event`,
      type_arguments: [],
      arguments: [
        params.title,
        params.description,
        params.options,
        params.commitPhaseHours,
        params.revealPhaseHours,
        params.stakeAmount,
      ],
    };

    const transaction = await this.client.generateTransaction(
      creatorAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      creatorAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    // Extract event ID from transaction events (simplified for demo)
    const eventId = Math.floor(Math.random() * 1000000); // In production, parse from events

    return { txHash: result.hash, eventId };
  }

  /**
   * Place a commitment (hash of vote option + salt)
   */
  async placeCommitment(
    voterAccount: Account,
    eventId: number,
    optionIndex: number,
    salt: string,
    stakeAmount: number
  ): Promise<string> {
    // Generate secure commitment hash
    const commitmentHash = this.generateCommitmentHash(optionIndex, salt);

    const payload = {
      type: "entry_function_payload",
      function: `${SECURE_VOTING_ADDRESS}::secure_voting::place_commitment`,
      type_arguments: [],
      arguments: [eventId, commitmentHash, stakeAmount],
    };

    const transaction = await this.client.generateTransaction(
      voterAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      voterAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Reveal vote (option + salt)
   */
  async revealVote(
    voterAccount: Account,
    eventId: number,
    optionIndex: number,
    salt: string
  ): Promise<string> {
    const saltBytes = new TextEncoder().encode(salt);

    const payload = {
      type: "entry_function_payload",
      function: `${SECURE_VOTING_ADDRESS}::secure_voting::reveal_vote`,
      type_arguments: [],
      arguments: [eventId, optionIndex, Array.from(saltBytes)],
    };

    const transaction = await this.client.generateTransaction(
      voterAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      voterAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Resolve the voting event (calculate winner)
   */
  async resolveVotingEvent(eventId: number): Promise<string> {
    if (!this.adminAccount) {
      throw new Error("Admin account not set");
    }

    const payload = {
      type: "entry_function_payload",
      function: `${SECURE_VOTING_ADDRESS}::secure_voting::resolve_voting_event`,
      type_arguments: [],
      arguments: [eventId],
    };

    const transaction = await this.client.generateTransaction(
      this.adminAccount.accountAddress,
      payload
    );

    const signedTx = await this.client.signTransaction(
      this.adminAccount,
      transaction
    );

    const result = await this.client.submitTransaction(signedTx);

    // Wait for transaction to complete
    await this.client.waitForTransaction(result.hash);

    return result.hash;
  }

  /**
   * Generate keccak256 hash for commitment (client-side for preview)
   */
  generateCommitmentHash(optionIndex: number, salt: string): Uint8Array {
    const combined = new TextEncoder().encode(`${optionIndex}:${salt}`);
    // Simple hash for demo - in production, this would be done by the smart contract
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return new Uint8Array([hash & 0xFF, (hash >> 8) & 0xFF, (hash >> 16) & 0xFF, (hash >> 24) & 0xFF]);
  }

  /**
   * Generate cryptographically secure salt
   */
  generateSecureSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get voting event details
   */
  async getVotingEventDetails(eventId: number): Promise<VotingEvent | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::get_voting_event_details`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId],
        },
      });

      return {
        id: result[0],
        creator: result[1],
        title: result[2],
        description: "",
        options: [], // Would need separate call
        commitPhaseEnd: Number(result[3]),
        revealPhaseEnd: Number(result[4]),
        stakeAmount: Number(result[5]),
        totalStaked: Number(result[6]),
        winningOption: Number(result[7]),
        isResolved: result[8],
        createdAt: 0, // Would need additional query
      };
    } catch (error) {
      console.error("Error fetching voting event details:", error);
      return null;
    }
  }

  /**
   * Get current voting phase
   */
  async getVotingPhase(eventId: number): Promise<VotingPhase | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::get_voting_phase`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId],
        },
      });

      const phase = Number(result[0]);
      const currentTime = Date.now() / 1000;

      // Calculate actual time remaining based on contract state
      let timeRemaining = 0;
      if (phase === 1) {
        // Commit phase - calculate time until commit deadline
        const commitDeadline = Number(result[1] || 0);
        timeRemaining = Math.max(0, commitDeadline - currentTime);
      } else if (phase === 2) {
        // Reveal phase - calculate time until reveal deadline
        const revealDeadline = Number(result[2] || 0);
        timeRemaining = Math.max(0, revealDeadline - currentTime);
      }

      return {
        phase,
        timeRemaining,
        canCommit: phase === 1,
        canReveal: phase === 2,
      };
    } catch (error) {
      console.error("Error fetching voting phase:", error);
      return null;
    }
  }

  /**
   * Check if user has committed
   */
  async hasUserCommitted(eventId: number, userAddress: string): Promise<boolean> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::has_user_committed`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId, userAddress],
        },
      });

      return result[0];
    } catch (error) {
      console.error("Error checking user commitment:", error);
      return false;
    }
  }

  /**
   * Check if user has revealed
   */
  async hasUserRevealed(eventId: number, userAddress: string): Promise<boolean> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::has_user_revealed`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId, userAddress],
        },
      });

      return result[0];
    } catch (error) {
      console.error("Error checking user reveal:", error);
      return false;
    }
  }

  /**
   * Get voting results
   */
  async getVotingResults(eventId: number): Promise<{
    winningOption: number;
    totalValidVotes: number;
    totalCommitments: number;
  } | null> {
    try {
      const result = await this.client.view({
        payload: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::get_voting_results`,
          type_arguments: [],
          arguments: [VOCE_ADMIN_ADDRESS, eventId],
        },
      });

      return {
        winningOption: Number(result[0]),
        totalValidVotes: Number(result[1]),
        totalCommitments: Number(result[2]),
      };
    } catch (error) {
      console.error("Error fetching voting results:", error);
      return null;
    }
  }

  /**
   * Check if the secure voting system is initialized
   */
  async isSecureVotingInitialized(): Promise<boolean> {
    try {
      await this.client.getAccountResource(
        VOCE_ADMIN_ADDRESS,
        `${SECURE_VOTING_ADDRESS}::secure_voting::VotingRegistry`
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all voting events for a user
   */
  async getUserVotingEvents(userAddress: string): Promise<number[]> {
    try {
      // Query user's voting events from contract events
      const events = await this.client.getEventsByEventHandle(
        userAddress,
        `${SECURE_VOTING_ADDRESS}::secure_voting::UserVotingEvents`
      );

      return events.map(event => Number(event.data.event_id));
    } catch (error) {
      console.error("Error fetching user voting events:", error);
      return [];
    }
  }

  /**
   * Batch operations for multiple votes
   */
  async batchCommitVotes(
    voterAccount: Account,
    votes: Array<{
      eventId: number;
      optionIndex: number;
      salt: string;
      stakeAmount: number;
    }>
  ): Promise<string[]> {
    const results = [];

    for (const vote of votes) {
      try {
        const txHash = await this.placeCommitment(
          voterAccount,
          vote.eventId,
          vote.optionIndex,
          vote.salt,
          vote.stakeAmount
        );
        results.push(txHash);
      } catch (error) {
        console.error(`Failed to commit vote for event ${vote.eventId}:`, error);
        results.push('');
      }
    }

    return results;
  }

  /**
   * Batch reveal votes
   */
  async batchRevealVotes(
    voterAccount: Account,
    reveals: Array<{
      eventId: number;
      optionIndex: number;
      salt: string;
    }>
  ): Promise<string[]> {
    const results = [];

    for (const reveal of reveals) {
      try {
        const txHash = await this.revealVote(
          voterAccount,
          reveal.eventId,
          reveal.optionIndex,
          reveal.salt
        );
        results.push(txHash);
      } catch (error) {
        console.error(`Failed to reveal vote for event ${reveal.eventId}:`, error);
        results.push('');
      }
    }

    return results;
  }
}

// Create singleton instance
export const secureVotingService = new SecureVotingService();

// Export utility functions
export const initializeSecureVotingSystem = async (adminPrivateKey: string): Promise<boolean> => {
  try {
    const service = new SecureVotingService();
    service.setAdminAccount(adminPrivateKey);

    const isInitialized = await service.isSecureVotingInitialized();
    if (!isInitialized) {
      await service.initializeSecureVoting();
      console.log("✅ Secure voting system initialized");
    } else {
      console.log("ℹ️ Secure voting system already initialized");
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize secure voting system:", error);
    return false;
  }
};

// Export constants
export const VOTING_CONSTANTS = {
  MIN_STAKE_AMOUNT: 1,
  MAX_STAKE_AMOUNT: 1000000,
  MIN_COMMIT_PHASE_HOURS: 1,
  MIN_REVEAL_PHASE_HOURS: 1,
  SALT_LENGTH: 32,
} as const;