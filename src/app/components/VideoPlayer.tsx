import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  isPlaying: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ isPlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <div className="relative w-full aspect-video">
      <video 
        ref={videoRef}
        className="w-full rounded-lg"
        controls
        playsInline
      >
        <source src="/story.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer; 