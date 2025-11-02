import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/contexts/WalletContext';
import { useShelby } from '@/aptos/hooks/useShelby';
import { useGamifiedVoting } from '@/hooks/useGamifiedVoting';
import VideoPlayer from '@/aptos/components/VideoPlayer';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  Settings,
  Share2,
  DollarSign,
  Trophy,
  Flame,
  AlertCircle,
  Play,
  Square,
  Camera
} from 'lucide-react';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  category: 'ai_battle' | 'prediction_reveal' | 'creator_show' | 'tournament';
  isLive: boolean;
  viewerCount: number;
  startTime: number;
  duration: number;
  streamKey?: string;
  predictionEnabled: boolean;
  votingEventId?: string;
  participants: number;
  rewardPool: number;
}

interface LiveStreamingStudioProps {
  compact?: boolean;
}

const LiveStreamingStudio: React.FC<LiveStreamingStudioProps> = ({ compact = false }) => {
  const { isConnected, account } = useWallet();
  const { uploadFile, getStreamUrl } = useShelby();
  const { castVoteWithGamification } = useGamifiedVoting();

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LiveEvent['category']>('creator_show');

  // Media state
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Live events
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<LiveEvent | null>(null);

  // Prediction integration
  const [showPredictionPanel, setShowPredictionPanel] = useState(false);
  const [activePrediction, setActivePrediction] = useState({
    question: '',
    options: ['Option 1', 'Option 2'],
    votingEnabled: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated live events data
  const mockLiveEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'AI vs Human Chess Championship',
      description: 'Watch as GPT-4 takes on a human grandmaster in real-time',
      category: 'ai_battle',
      isLive: true,
      viewerCount: 1247,
      startTime: Date.now() - 300000, // 5 minutes ago
      duration: 3600000, // 1 hour
      predictionEnabled: true,
      votingEventId: 'ai_chess_001',
      participants: 892,
      rewardPool: 5000
    },
    {
      id: '2',
      title: 'Crypto Prediction Reveal',
      description: 'Live results of this week\'s cryptocurrency predictions',
      category: 'prediction_reveal',
      isLive: true,
      viewerCount: 856,
      startTime: Date.now() - 120000, // 2 minutes ago
      duration: 1800000, // 30 minutes
      predictionEnabled: false,
      participants: 445,
      rewardPool: 2500
    },
    {
      id: '3',
      title: 'Creator Q&A Session',
      description: 'Join our top predictor for insights and strategies',
      category: 'creator_show',
      isLive: false,
      viewerCount: 0,
      startTime: Date.now() + 3600000, // 1 hour from now
      duration: 5400000, // 1.5 hours
      predictionEnabled: true,
      participants: 0,
      rewardPool: 1000
    }
  ];

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled,
        audio: micEnabled
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;

      // Set up media recorder for recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Failed to initialize media:', error);
    }
  }, [cameraEnabled, micEnabled]);

  // Start streaming
  const startStreaming = useCallback(async () => {
    if (!streamTitle.trim()) {
      alert('Please enter a stream title');
      return;
    }

    setIsStreaming(true);
    setStreamDuration(0);

    // Create new live event
    const newEvent: LiveEvent = {
      id: Date.now().toString(),
      title: streamTitle,
      description: streamDescription,
      category: selectedCategory,
      isLive: true,
      viewerCount: 0,
      startTime: Date.now(),
      duration: 7200000, // 2 hours default
      predictionEnabled: selectedCategory !== 'prediction_reveal',
      participants: 0,
      rewardPool: 1000
    };

    setCurrentEvent(newEvent);
    setLiveEvents(prev => [newEvent, ...prev]);

    // Start duration tracking
    durationIntervalRef.current = setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);

    // Simulate viewer count growth
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => {
        const growth = Math.floor(Math.random() * 10) + 1;
        return prev + growth;
      });
    }, 5000);

    // Stop viewer simulation after 30 seconds for demo
    setTimeout(() => clearInterval(viewerInterval), 30000);
  }, [streamTitle, streamDescription, selectedCategory]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (currentEvent) {
      setCurrentEvent({
        ...currentEvent,
        isLive: false,
        duration: streamDuration * 1000
      });
    }
  }, [currentEvent, streamDuration]);

  // Start recording
  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // Upload recorded video
  const uploadRecording = useCallback(async () => {
    if (!recordedBlob || !account) return;

    try {
      setUploadProgress(0);

      const file = new File([recordedBlob], `stream-${Date.now()}.webm`, {
        type: 'video/webm'
      });

      const blobInfo = await uploadFile(file, {
        contentType: 'video/webm',
        expirationDays: 30
      });

      if (blobInfo) {
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 2000);
        console.log('Recording uploaded successfully:', blobInfo);
      }
    } catch (error) {
      console.error('Failed to upload recording:', error);
    }
  }, [recordedBlob, account, uploadFile]);

  // Handle prediction voting during stream
  const handleStreamPrediction = useCallback(async (optionIndex: number) => {
    if (!currentEvent?.votingEventId) return;

    try {
      await castVoteWithGamification(
        currentEvent.votingEventId,
        `option_${optionIndex}`,
        10,
        'medium'
      );

      // Update participant count
      if (currentEvent) {
        setCurrentEvent({
          ...currentEvent,
          participants: currentEvent.participants + 1
        });
      }
    } catch (error) {
      console.error('Failed to cast prediction vote:', error);
    }
  }, [currentEvent, castVoteWithGamification]);

  // Initialize media on mount
  useEffect(() => {
    initializeMedia();
    setLiveEvents(mockLiveEvents);

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [initializeMedia]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Category icons
  const getCategoryIcon = (category: LiveEvent['category']) => {
    switch (category) {
      case 'ai_battle': return <Target className="w-4 h-4" />;
      case 'prediction_reveal': return <Trophy className="w-4 h-4" />;
      case 'creator_show': return <Users className="w-4 h-4" />;
      case 'tournament': return <Flame className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  // Category colors
  const getCategoryColor = (category: LiveEvent['category']) => {
    switch (category) {
      case 'ai_battle': return 'bg-red-500';
      case 'prediction_reveal': return 'bg-blue-500';
      case 'creator_show': return 'bg-green-500';
      case 'tournament': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Live Studio</h3>
            </div>
            {liveEvents.filter(e => e.isLive).length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {liveEvents.filter(e => e.isLive).length} Live
              </Badge>
            )}
          </div>

          {/* Current Live Events */}
          <div className="space-y-2">
            {liveEvents.filter(e => e.isLive).slice(0, 2).map((event) => (
              <div key={event.id} className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)} animate-pulse`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.viewerCount} watching
                  </div>
                </div>
                <Eye className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
          </div>

          {isConnected && (
            <Button
              className="w-full mt-3"
              onClick={() => window.open('/streaming-studio', '_blank')}
            >
              <Camera className="w-4 h-4 mr-2" />
              Open Studio
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Live Streaming Studio
            </CardTitle>
            <div className="flex items-center gap-2">
              {liveEvents.filter(e => e.isLive).length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  {liveEvents.filter(e => e.isLive).length} Live Now
                </Badge>
              )}
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                {liveEvents.reduce((sum, e) => sum + e.viewerCount, 0)} Total Viewers
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streaming Interface */}
        <div className="space-y-4">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Camera Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Streaming Overlay */}
                {isStreaming && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  </div>
                )}

                {/* Viewer Count */}
                {isStreaming && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <Eye className="w-3 h-3 mr-1" />
                      {viewerCount}
                    </Badge>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      REC
                    </Badge>
                  </div>
                )}

                {/* Stream Duration */}
                {isStreaming && (
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(streamDuration)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Media Controls */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={cameraEnabled ? '' : 'bg-red-50 text-red-600 border-red-200'}
                >
                  {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={micEnabled ? '' : 'bg-red-50 text-red-600 border-red-200'}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'bg-red-50 text-red-600 border-red-200' : ''}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stream Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stream-title">Stream Title</Label>
                <Input
                  id="stream-title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter an engaging title for your stream"
                  disabled={isStreaming}
                />
              </div>

              <div>
                <Label htmlFor="stream-description">Description</Label>
                <Input
                  id="stream-description"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="What's your stream about?"
                  disabled={isStreaming}
                />
              </div>

              <div>
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ai_battle', label: 'AI Battle', icon: <Target className="w-4 h-4" /> },
                    { value: 'prediction_reveal', label: 'Prediction Reveal', icon: <Trophy className="w-4 h-4" /> },
                    { value: 'creator_show', label: 'Creator Show', icon: <Users className="w-4 h-4" /> },
                    { value: 'tournament', label: 'Tournament', icon: <Flame className="w-4 h-4" /> },
                  ].map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.value as LiveEvent['category'])}
                      disabled={isStreaming}
                      className="justify-start"
                    >
                      {cat.icon}
                      <span className="ml-2">{cat.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Streaming Controls */}
              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button
                    onClick={startStreaming}
                    disabled={!streamTitle.trim() || !isConnected}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Go Live
                  </Button>
                ) : (
                  <Button
                    onClick={stopStreaming}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Stream
                  </Button>
                )}

                {recordedBlob && (
                  <Button
                    onClick={uploadRecording}
                    disabled={uploadProgress > 0}
                    variant="outline"
                  >
                    {uploadProgress > 0 ? (
                      <>{uploadProgress}%</>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>

              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Events and Interaction */}
        <div className="space-y-4">
          {/* Current Live Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" />
                Live Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveEvents
                  .filter(event => event.isLive)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setCurrentEvent(event)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)} animate-pulse`}></div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(event.category)}
                            <span className="ml-1 capitalize">
                              {event.category.replace('_', ' ')}
                            </span>
                          </Badge>
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            LIVE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {event.viewerCount}
                        </div>
                      </div>

                      <h4 className="font-semibold mb-1">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-secondary">{event.participants}</div>
                          <div className="text-muted-foreground">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-success">${event.rewardPool}</div>
                          <div className="text-muted-foreground">Reward Pool</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-accent">
                            {formatDuration(Math.floor((Date.now() - event.startTime) / 1000))}
                          </div>
                          <div className="text-muted-foreground">Duration</div>
                        </div>
                      </div>

                      {event.predictionEnabled && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePrediction({
                                question: `Who will win this ${event.category.replace('_', ' ')}?`,
                                options: ['Option A', 'Option B'],
                                votingEnabled: true
                              });
                              setShowPredictionPanel(true);
                            }}
                            className="w-full"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Place Prediction
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                {liveEvents.filter(e => e.isLive).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No live events right now</p>
                    <p className="text-sm">Start your own stream or check back later!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveEvents
                  .filter(event => !event.isLive && event.startTime > Date.now())
                  .map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(event.category)}
                        <Badge variant="outline" className="text-xs">
                          {event.category.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Starting Soon
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Starts in {Math.ceil((event.startTime - Date.now()) / 60000)} minutes
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prediction Panel Dialog */}
      <Dialog open={showPredictionPanel} onOpenChange={setShowPredictionPanel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Live Prediction
            </DialogTitle>
            <DialogDescription>
              Place your prediction during the live event!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{activePrediction.question}</h4>
              <div className="space-y-2">
                {activePrediction.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleStreamPrediction(index)}
                    className="w-full justify-start"
                    disabled={!activePrediction.votingEnabled}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Earn XP and rewards for correct predictions during live events!
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveStreamingStudio;