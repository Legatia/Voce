import { BlobInfo } from "../aptos/services/shelby";

// Base event interface
export interface BaseEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  creator: string;
  createdAt: Date;
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  tags: string[];
  totalVolume: number;
  participantCount: number;
}

// Media-enhanced event for Shelby integration
export interface MediaEvent extends BaseEvent {
  // Shelby blob storage fields
  media?: {
    thumbnail?: BlobInfo;
    previewClip?: BlobInfo;
    stream?: BlobInfo;
    attachments?: BlobInfo[];
  };

  // Streaming configuration
  streamConfig?: {
    quality: '720p' | '1080p' | '4K';
    bandwidth: string;
    viewerLimit: number;
    isLive: boolean;
  };

  // Access control
  accessType: 'free' | 'premium';
  accessPrice?: number; // APT tokens
  requiredLevel?: number; // Minimum user level
}

// Event categories
export type EventCategory =
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'technology'
  | 'finance'
  | 'crypto'
  | 'gaming'
  | 'science'
  | 'weather'
  | 'social';

// Event status
export type EventStatus =
  | 'upcoming'
  | 'active'
  | 'voting'
  | 'resolved'
  | 'cancelled';

// Voting option
export interface VotingOption {
  id: string;
  text: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

// Vote data
export interface Vote {
  id: string;
  eventId: string;
  voter: string;
  optionId: string;
  amount: number;
  timestamp: Date;
  isCommitReveal?: boolean;
  commitment?: string;
  revealed?: boolean;
}

// Event outcome
export interface EventOutcome {
  eventId: string;
  winningOptionId: string;
  isDecided: boolean;
  decidedAt?: Date;
  resolutionSource?: string;
  metadata?: Record<string, any>;
}

// Event statistics
export interface EventStats {
  totalVolume: number;
  totalVotes: number;
  uniqueVoters: number;
  topVoters: Array<{
    address: string;
    amount: number;
    votingPower: number;
  }>;
  votingDistribution: Array<{
    optionId: string;
    percentage: number;
    amount: number;
  }>;
  priceHistory: Array<{
    timestamp: Date;
    price: number;
    volume: number;
  }>;
}

// Event creation request
export interface CreateEventRequest {
  title: string;
  description: string;
  category: EventCategory;
  startsAt: Date;
  endsAt: Date;
  votingOptions: Omit<VotingOption, 'id' | 'order'>[];
  tags: string[];
  accessType: 'free' | 'premium';
  accessPrice?: number;
  requiredLevel?: number;
  streamConfig?: {
    quality: '720p' | '1080p' | '4K';
    bandwidth: string;
    viewerLimit: number;
  };
  mediaFiles?: {
    thumbnail?: File;
    previewClip?: File;
    attachments?: File[];
  };
}

// Event filter and search
export interface EventFilter {
  category?: EventCategory;
  status?: EventStatus;
  creator?: string;
  tags?: string[];
  accessType?: 'free' | 'premium';
  hasMedia?: boolean;
  isLive?: boolean;
  minVolume?: number;
  maxVolume?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Event sorting options
export type EventSortBy =
  | 'createdAt'
  | 'startsAt'
  | 'endsAt'
  | 'totalVolume'
  | 'participantCount'
  | 'popularity';

export type SortOrder = 'asc' | 'desc';

export interface EventSort {
  sortBy: EventSortBy;
  order: SortOrder;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Event list response
export interface EventListResponse {
  events: MediaEvent[];
  pagination: Pagination;
  filters: EventFilter;
  sort: EventSort;
}