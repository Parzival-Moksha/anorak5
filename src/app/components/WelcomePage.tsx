'use client';
import { useState, useRef } from 'react';

interface WelcomePageProps {
  onEnter: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
        >
          <source src="/story.mp4" type="video/mp4" />
        </video>

        <div className="absolute left-1/2 bottom-[20%] -translate-x-1/2 z-10 flex flex-col items-center gap-4">
          <button
            onClick={toggleMute}
            className="px-6 py-2 rounded-full bg-black/30 backdrop-blur-sm
              hover:bg-black/50 transition-all duration-300 flex items-center gap-2
              border border-white/20"
          >
            {isMuted ? (
              <>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span className="text-white text-sm">Unmute Video</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-white text-sm">Mute Video</span>
              </>
            )}
          </button>

          <button
            onClick={onEnter}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              px-12 py-4 text-2xl font-bold
              text-indigo-300
              bg-transparent hover:bg-gradient-to-r hover:from-purple-600/80 hover:to-pink-600/80
              rounded-full transform transition-all duration-300
              border border-white/20 backdrop-blur-md
              shadow-[0_0_30px_rgba(168,85,247,0.2)]
              hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]
              hover:scale-110
              animate-fadeIn
            `}
          >
            LIBERATE MOKSHA
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage; 