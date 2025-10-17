import { AccountAddress, U64 } from "@aptos-labs/ts-sdk";

// Event types matching our frontend demo
export interface PredictionEvent {
  id: U64;
  creator: AccountAddress;
  title: string;
  description: string;
  category: string;
  region: string;
  votingDeadline: U64; // timestamp in seconds
  resultDeadline: U64; // timestamp in seconds
  resolutionCriteria: string;
  dataSources: string[];
  isVotingClosed: boolean;
  isResolved: boolean;
  outcome: boolean | null; // true/false for resolved events
  totalVotes: U64;
  yesVotes: U64;
  noVotes: U64;
  xpReward: U64;
  aptReward: U64; // in octas (1 APT = 100,000,000 octas)
  created: U64; // timestamp in seconds
}

export interface Vote {
  voter: AccountAddress;
  eventId: U64;
  prediction: boolean; // true for YES, false for NO
  timestamp: U64;
  claimedRewards: boolean;
}

export interface UserStats {
  address: AccountAddress;
  totalXP: U64;
  totalEarned: U64; // in octas
  totalVotes: U64;
  correctPredictions: U64;
  accuracy: number; // percentage
  level: number;
  createdEvents: U64;
}

export interface MarketplaceItem {
  id: U64;
  itemType: "vote_ticket" | "nft";
  name: string;
  description: string;
  price: U64; // in octas
  stock: U64;
  isLimited: boolean;
  metadata: string; // URI or JSON string for additional data
}

export interface UserNFT {
  id: U64;
  tokenId: U64;
  owner: AccountAddress;
  itemType: "vote_ticket" | "nft";
  name: string;
  metadata: string;
  xpBonus: number; // percentage bonus
  acquired: U64; // timestamp
}

// Transaction types
export interface CreateEventParams {
  title: string;
  description: string;
  category: string;
  region: string;
  votingDeadline: U64;
  resultDeadline: U64;
  resolutionCriteria: string;
  dataSources: string[];
  xpReward: U64;
  aptReward: U64;
}

export interface VoteParams {
  eventId: U64;
  prediction: boolean;
}

export interface ClaimRewardsParams {
  eventId: U64;
}

export interface PurchaseItemParams {
  itemId: U64;
  quantity: U64;
}

// Contract function names
export const CONTRACT_FUNCTIONS = {
  CREATE_EVENT: "create_event",
  VOTE: "vote",
  CLAIM_REWARDS: "claim_rewards",
  PURCHASE_ITEM: "purchase_item",
  CREATE_MARKETPLACE_ITEM: "create_marketplace_item",
  RESOLVE_EVENT: "resolve_event", // for admin/oracle
} as const;

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0x1", // placeholder, will be updated after deployment
  MARKETPLACE: "0x1", // placeholder, will be updated after deployment
} as const;

// Event categories matching frontend
export const EVENT_CATEGORIES = [
  "Technology",
  "Crypto",
  "Politics",
  "Finance",
  "Health",
  "Space",
  "Sports",
  "Environment",
  "Economy",
  "Other",
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

// Regions matching frontend
export const EVENT_REGIONS = [
  "Global",
  "Americas",
  "Europe",
  "Asia",
  "Africa",
] as const;

export type EventRegion = typeof EVENT_REGIONS[number];