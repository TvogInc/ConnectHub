import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export function VideoCallWindow({ onClose }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    initializeMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to get media devices:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col">
        {/* Main video area */}
        <div className="flex-1 relative">
          {/* Remote video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-muted"
          />
          
          {/* Placeholder for remote user */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                <Video className="w-16 h-16 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold">Connecting...</p>
              <p className="text-sm text-muted-foreground mt-1">Waiting for other participant</p>
            </div>
          </div>

          {/* Local video (picture-in-picture) */}
          <Card className="absolute bottom-6 right-6 w-64 h-48 overflow-hidden shadow-2xl border-2">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                !videoEnabled && "hidden"
              )}
            />
            {!videoEnabled && (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </Card>
        </div>

        {/* Controls */}
        <div className="h-24 bg-card border-t border-border flex items-center justify-center gap-4 px-6">
          <Button
            size="lg"
            variant={videoEnabled ? "default" : "destructive"}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={audioEnabled ? "default" : "destructive"}
            onClick={toggleAudio}
            className="rounded-full w-14 h-14"
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEndCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-full w-14 h-14"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
