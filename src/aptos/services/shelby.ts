import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network, Account, AccountAddress } from "@aptos-labs/ts-sdk";

// Environment configuration
const SHELBY_API_KEY = import.meta.env.VITE_SHELBY_API_KEY;
const SHELBY_NETWORK = import.meta.env.VITE_SHELBY_NETWORK || "SHELBYNET";
const SHELBY_ACCOUNT_ADDRESS = import.meta.env.VITE_SHELBY_ACCOUNT_ADDRESS;
const SHELBY_ACCOUNT_PRIVATE_KEY = import.meta.env.VITE_SHELBY_ACCOUNT_PRIVATE_KEY;

if (!SHELBY_API_KEY) {
  console.warn("Shelby API key not found in environment variables. Please set VITE_SHELBY_API_KEY in .env.local");
}

// Default expiration times (in microseconds)
const DEFAULT_EXPIRY = 30 * 24 * 60 * 60 * 1_000_000; // 30 days
const MIN_EXPIRY = 60 * 1_000_000; // 1 minute
const MAX_EXPIRY = 365 * 24 * 60 * 60 * 1_000_000; // 1 year

// Enhanced blob info interface for Voce
export interface BlobInfo {
  blobId: string;
  account: string;
  blobName: string;
  size: number;
  url?: string;
  contentType?: string;
  createdAt: Date;
  expirationMicros: number;
}

// Upload options for Voce
export interface UploadOptions {
  contentType?: string;
  expirationDays?: number;
  chunksetSizeBytes?: number;
}

// Voce-specific Shelby service wrapper
export class VoceShelbyService {
  private client: ShelbyNodeClient;
  private account: Account | null = null;

  constructor(apiKey?: string) {
    const effectiveApiKey = apiKey || SHELBY_API_KEY;

    if (!effectiveApiKey) {
      throw new Error("Shelby API key is required. Please set VITE_SHELBY_API_KEY in your environment variables.");
    }

    // Initialize Shelby client using official pattern
    this.client = new ShelbyNodeClient({
      network: Network.SHELBYNET,
      apiKey: effectiveApiKey,
    });
  }

  /**
   * Set the account for blockchain operations
   */
  setAccount(account: Account) {
    this.account = account;
  }

  /**
   * Upload a file to Shelby storage using official pattern
   */
  async uploadFile(
    file: File,
    blobName: string,
    options?: UploadOptions
  ): Promise<BlobInfo> {
    if (!this.account) {
      throw new Error("No account set for upload. Call setAccount() first.");
    }

    try {
      // Convert file to Uint8Array (as shown in official examples)
      const arrayBuffer = await file.arrayBuffer();
      const blobData = new Uint8Array(arrayBuffer);

      // Calculate expiration using official pattern (microseconds from now)
      const expirationMicros = Date.now() * 1000 + (options?.expirationDays ?
        options.expirationDays * 24 * 60 * 60 * 1_000_000 :
        DEFAULT_EXPIRY
      );

      // Validate expiration bounds
      const minExpirationMicros = Date.now() * 1000 + MIN_EXPIRY;
      const maxExpirationMicros = Date.now() * 1000 + MAX_EXPIRY;

      if (expirationMicros < minExpirationMicros) {
        throw new Error(`Expiration time must be at least 1 minute from now`);
      }

      if (expirationMicros > maxExpirationMicros) {
        throw new Error(`Expiration time cannot exceed 1 year from now`);
      }

      // Upload to Shelby using official pattern
      await this.client.upload({
        blobData,
        signer: this.account,
        blobName,
        expirationMicros,
      });

      // Return blob info following official pattern
      const accountAddress = this.account.accountAddress.toString();
      return {
        blobId: `${accountAddress}/${blobName}`,
        account: accountAddress,
        blobName,
        size: file.size,
        contentType: file.type || options?.contentType,
        createdAt: new Date(),
        expirationMicros
      };

    } catch (error) {
      console.error('Shelby upload error:', error);

      // Handle specific error types based on official examples
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('EBLOB_WRITE_CHUNKSET_ALREADY_EXISTS')) {
        throw new Error('This blob already exists. Try a different name or delete the existing one first.');
      }

      if (errorMessage.includes('INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE')) {
        throw new Error('Insufficient APT balance to pay for transaction fees. Please fund your account.');
      }

      if (errorMessage.includes('E_INSUFFICIENT_FUNDS')) {
        throw new Error('Insufficient ShelbyUSD balance to upload this blob. Please fund your account.');
      }

      if (errorMessage.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later or use your own API key.');
      }

      if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
        throw new Error('Shelby server error. Please try again later.');
      }

      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }

  /**
   * Download a blob from Shelby storage using official pattern
   */
  async downloadBlob(account: string, blobName: string): Promise<Uint8Array> {
    try {
      const accountAddress = AccountAddress.fromString(account);
      const blob = await this.client.download({
        account: accountAddress,
        blobName
      });

      // Handle streaming response
      if (blob.readable) {
        // Convert Web Stream to Uint8Array for browser compatibility
        const reader = blob.readable.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        return result;
      }

      // Fallback to blob.data if available
      return blob.data || new Uint8Array();

    } catch (error) {
      console.error('Shelby download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle specific error types based on official examples
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new Error('Blob not found. It may have expired or been deleted.');
      }

      if (errorMessage.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
        throw new Error('Shelby server error. Please try again later.');
      }

      throw new Error(`Download failed: ${errorMessage}`);
    }
  }

  /**
   * Get blob info (metadata only)
   */
  async getBlobInfo(account: string, blobName: string): Promise<BlobInfo> {
    try {
      const blob = await this.client.download({
        account,
        blobName
      });

      return {
        blobId: `${account}/${blobName}`,
        account,
        blobName,
        size: blob.data.length,
        createdAt: new Date(),
        expirationMicros: blob.expirationMicros || 0
      };
    } catch (error) {
      console.error('Shelby get blob info error:', error);
      throw new Error(`Get blob info failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a blob URL for streaming using optimized approach
   */
  async createStreamUrl(account: string, blobName: string): Promise<string> {
    try {
      // For small files (< 10MB), download and create blob URL
      // For larger files, consider implementing progressive loading
      const blobData = await this.downloadBlob(account, blobName);
      const blob = new Blob([blobData]);
      const url = URL.createObjectURL(blob);

      // Auto-revoke URL after 1 hour to prevent memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60 * 60 * 1000);

      return url;
    } catch (error) {
      console.error('Shelby stream error:', error);
      throw new Error(`Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a blob exists (lightweight operation)
   */
  async blobExists(account: string, blobName: string): Promise<boolean> {
    try {
      const accountAddress = AccountAddress.fromString(account);
      await this.client.download({
        account: accountAddress,
        blobName
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Generate unique blob name for file
   */
  generateBlobName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const prefixPath = prefix ? `${prefix}/` : '';
    return `${prefixPath}${timestamp}_${randomId}_${sanitized}`;
  }

  /**
   * Get the underlying Shelby client for advanced operations
   */
  getClient(): ShelbyNodeClient {
    return this.client;
  }
}

// Create singleton instance for the app (with lazy initialization)
let shelbyServiceInstance: VoceShelbyService | null = null;

export const getShelbyService = (): VoceShelbyService => {
  if (!shelbyServiceInstance) {
    shelbyServiceInstance = new VoceShelbyService();
  }
  return shelbyServiceInstance;
};

// Backward compatibility
export const shelbyService = getShelbyService();

// Export types for backward compatibility
export type { ShelbyClientConfig };