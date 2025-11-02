import { useState, useCallback, useEffect } from "react";
import { shelbyService, BlobInfo } from "../services/shelby";
import { useWallet } from "../../contexts/WalletContext";

interface UseShelbyReturn {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;

  // Blob management
  uploadedBlobs: BlobInfo[];

  // Actions
  uploadFile: (file: File, options?: {
    contentType?: string;
    expirationDays?: number;
    chunksetSizeBytes?: number;
  }) => Promise<BlobInfo | null>;
  getStreamUrl: (account: string, blobName: string) => Promise<string | null>;
  deleteBlob: (account: string, blobName: string) => Promise<boolean>;
  clearError: () => void;
}

export const useShelby = (): UseShelbyReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedBlobs, setUploadedBlobs] = useState<BlobInfo[]>([]);

  const { account, isConnected } = useWallet();

  // Update Shelby service with current account
  useEffect(() => {
    if (account && isConnected) {
      shelbyService.setAccount(account);
    }
  }, [account, isConnected]);

  const uploadFile = useCallback(async (
    file: File,
    options?: {
      contentType?: string;
      expirationDays?: number;
      chunksetSizeBytes?: number;
    }
  ): Promise<BlobInfo | null> => {
    if (!account || !isConnected) {
      setUploadError("Wallet not connected. Please connect your wallet to upload files.");
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      // Check file size (limit to 500MB for now)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 500MB limit");
      }

      // Generate unique blob name
      const blobName = shelbyService.generateBlobName(file.name, "voce-events");

      // Simulate upload progress (since real progress might need chunked upload)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const blobInfo = await shelbyService.uploadFile(file, blobName, options);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to uploaded blobs
      setUploadedBlobs(prev => [...prev, blobInfo]);

      console.log("Successfully uploaded file to Shelby:", blobInfo);
      return blobInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      console.error("Shelby upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [account, isConnected]);

  const getStreamUrl = useCallback(async (account: string, blobName: string): Promise<string | null> => {
    try {
      const url = await shelbyService.createStreamUrl(account, blobName);
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get stream URL";
      setUploadError(errorMessage);
      console.error("Shelby get stream URL error:", error);
      return null;
    }
  }, []);

  const deleteBlob = useCallback(async (account: string, blobName: string): Promise<boolean> => {
    try {
      // Note: Shelby doesn't have a direct delete method in the SDK
      // This would need to be implemented via blockchain operations
      // For now, we'll just remove from our local state
      setUploadedBlobs(prev => prev.filter(blob =>
        !(blob.account === account && blob.blobName === blobName)
      ));

      console.log("Removed blob from local state:", `${account}/${blobName}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete blob";
      setUploadError(errorMessage);
      console.error("Shelby delete error:", error);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    // Upload state
    isUploading,
    uploadProgress,
    uploadError,

    // Blob management
    uploadedBlobs,

    // Actions
    uploadFile,
    getStreamUrl,
    deleteBlob,
    clearError,
  };
};