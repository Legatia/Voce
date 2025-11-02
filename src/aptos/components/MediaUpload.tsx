import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Upload,
  X,
  FileVideo,
  FileImage,
  AlertCircle,
  CheckCircle,
  Play,
  Eye
} from "lucide-react";
import { useShelby } from "../hooks/useShelby";
import { BlobInfo } from "../services/shelby";

interface MediaUploadProps {
  onMediaUpload: (media: {
    thumbnail?: BlobInfo;
    previewClip?: BlobInfo;
    stream?: BlobInfo;
    attachments?: BlobInfo[];
  }) => void;
  initialMedia?: {
    thumbnail?: BlobInfo;
    previewClip?: BlobInfo;
    stream?: BlobInfo;
    attachments?: BlobInfo[];
  };
  disabled?: boolean;
}

export const MediaUpload = ({
  onMediaUpload,
  initialMedia,
  disabled = false
}: MediaUploadProps) => {
  const {
    isUploading,
    uploadProgress,
    uploadError,
    uploadFile,
    getStreamUrl,
    deleteBlob,
    clearError
  } = useShelby();

  const [media, setMedia] = useState(initialMedia || {});
  const [streamConfig, setStreamConfig] = useState({
    quality: '1080p' as const,
    bandwidth: '10Mbps',
    viewerLimit: 1000
  });

  const fileInputRefs = {
    thumbnail: useRef<HTMLInputElement>(null),
    previewClip: useRef<HTMLInputElement>(null),
    stream: useRef<HTMLInputElement>(null),
    attachments: useRef<HTMLInputElement>(null)
  };

  const handleFileUpload = useCallback(async (
    file: File,
    mediaType: 'thumbnail' | 'previewClip' | 'stream' | 'attachments'
  ) => {
    if (!file) return;

    const options = {
      replication: 3,
      bandwidth: streamConfig.bandwidth
    };

    const blobInfo = await uploadFile(file, options);

    if (blobInfo) {
      const updatedMedia = { ...media };

      if (mediaType === 'attachments') {
        updatedMedia.attachments = [
          ...(updatedMedia.attachments || []),
          blobInfo
        ];
      } else {
        updatedMedia[mediaType] = blobInfo;
      }

      setMedia(updatedMedia);
      onMediaUpload(updatedMedia);
    }
  }, [media, uploadFile, streamConfig, onMediaUpload]);

  const handleRemoveMedia = useCallback(async (
    mediaType: 'thumbnail' | 'previewClip' | 'stream',
    blobId?: string
  ) => {
    if (!blobId) return;

    const success = await deleteBlob(blobId);

    if (success) {
      const updatedMedia = { ...media };
      delete updatedMedia[mediaType];
      setMedia(updatedMedia);
      onMediaUpload(updatedMedia);
    }
  }, [media, deleteBlob, onMediaUpload]);

  const handleRemoveAttachment = useCallback(async (blobId: string) => {
    const success = await deleteBlob(blobId);

    if (success) {
      const updatedMedia = {
        ...media,
        attachments: media.attachments?.filter(att => att.blobId !== blobId)
      };
      setMedia(updatedMedia);
      onMediaUpload(updatedMedia);
    }
  }, [media, deleteBlob, onMediaUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (contentType.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    return <Upload className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Stream Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stream Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Select value={streamConfig.quality} onValueChange={(value: any) =>
                setStreamConfig(prev => ({ ...prev, quality: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                  <SelectItem value="4K">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bandwidth">Bandwidth</Label>
              <Select value={streamConfig.bandwidth} onValueChange={(value) =>
                setStreamConfig(prev => ({ ...prev, bandwidth: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5Mbps">5 Mbps</SelectItem>
                  <SelectItem value="10Mbps">10 Mbps</SelectItem>
                  <SelectItem value="20Mbps">20 Mbps</SelectItem>
                  <SelectItem value="50Mbps">50 Mbps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="viewerLimit">Viewer Limit</Label>
              <Input
                type="number"
                value={streamConfig.viewerLimit}
                onChange={(e) => setStreamConfig(prev => ({
                  ...prev,
                  viewerLimit: parseInt(e.target.value) || 1000
                }))}
                min="1"
                max="100000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Error */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError}
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thumbnail Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Event Thumbnail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {media.thumbnail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={media.thumbnail.url}
                  alt="Thumbnail"
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {getFileIcon(media.thumbnail.contentType)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatFileSize(media.thumbnail.size)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {media.thumbnail.blobId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(media.thumbnail!.url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMedia('thumbnail', media.thumbnail!.blobId)}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload Thumbnail</h3>
              <p className="text-muted-foreground mb-4">
                Upload a high-quality thumbnail for your event (JPG, PNG, WebP)
              </p>
              <input
                ref={fileInputRefs.thumbnail}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')}
              />
              <Button
                onClick={() => fileInputRefs.thumbnail.current?.click()}
                disabled={isUploading || disabled}
              >
                Select Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Clip Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            Preview Clip
          </CardTitle>
        </CardHeader>
        <CardContent>
          {media.previewClip ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                  <FileVideo className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {getFileIcon(media.previewClip.contentType)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatFileSize(media.previewClip.size)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {media.previewClip.blobId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(media.previewClip!.url, '_blank')}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMedia('previewClip', media.previewClip!.blobId)}
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileVideo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload Preview Clip</h3>
              <p className="text-muted-foreground mb-4">
                Upload a short preview clip (MP4, WebM, max 50MB)
              </p>
              <input
                ref={fileInputRefs.previewClip}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'previewClip')}
              />
              <Button
                onClick={() => fileInputRefs.previewClip.current?.click()}
                disabled={isUploading || disabled}
              >
                Select Video
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Files</CardTitle>
        </CardHeader>
        <CardContent>
          {media.attachments && media.attachments.length > 0 ? (
            <div className="space-y-2">
              {media.attachments.map((attachment, index) => (
                <div key={attachment.blobId} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(attachment.contentType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">File {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(attachment.size)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {attachment.blobId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.blobId)}
                      disabled={disabled}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-semibold mb-2">Add Attachments</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add supporting files, images, or documents
              </p>
              <input
                ref={fileInputRefs.attachments}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.txt,.json"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => handleFileUpload(file, 'attachments'));
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRefs.attachments.current?.click()}
                disabled={isUploading || disabled}
              >
                Select Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};