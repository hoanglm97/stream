import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { 
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  Cog6ToothIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ReactPlayer from 'react-player';

const PictureInPicture = ({ 
  videoUrl, 
  videoTitle, 
  isActive, 
  onClose, 
  onFullscreen,
  initialPosition = { x: 20, y: 20 }
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [size, setSize] = useState('medium'); // small, medium, large
  const [position, setPosition] = useState(initialPosition);
  const [showControls, setShowControls] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(1);
  
  const dragControls = useDragControls();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const sizeConfig = {
    small: { width: 200, height: 113 },
    medium: { width: 300, height: 169 },
    large: { width: 400, height: 225 }
  };

  useEffect(() => {
    if (isActive) {
      // Ensure PiP stays within viewport
      const handleResize = () => {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          let newX = position.x;
          let newY = position.y;
          
          if (rect.right > viewportWidth) {
            newX = viewportWidth - rect.width - 20;
          }
          if (rect.bottom > viewportHeight) {
            newY = viewportHeight - rect.height - 20;
          }
          if (newX < 20) newX = 20;
          if (newY < 20) newY = 20;
          
          if (newX !== position.x || newY !== position.y) {
            setPosition({ x: newX, y: newY });
          }
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isActive, position]);

  const handleMouseEnter = () => {
    setShowControls(true);
    setOpacity(1);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setOpacity(0.7);
    }, 2000);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const changeSize = (newSize) => {
    setSize(newSize);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleProgress = ({ played, playedSeconds }) => {
    setCurrentTime(playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <motion.div
      ref={containerRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: 20,
        right: window.innerWidth - sizeConfig[size].width - 20,
        top: 20,
        bottom: window.innerHeight - sizeConfig[size].height - 20
      }}
      initial={{ 
        x: position.x, 
        y: position.y,
        scale: 0.8,
        opacity: 0
      }}
      animate={{ 
        x: position.x, 
        y: position.y,
        scale: 1,
        opacity: opacity,
        width: isMinimized ? 60 : sizeConfig[size].width,
        height: isMinimized ? 60 : sizeConfig[size].height
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed z-50 bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isMinimized ? 60 : sizeConfig[size].width,
        height: isMinimized ? 60 : sizeConfig[size].height
      }}
    >
      {isMinimized ? (
        // Minimized State
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center cursor-pointer"
          onClick={toggleMinimize}
        >
          <PlayIcon className="h-6 w-6 text-white" />
        </motion.div>
      ) : (
        // Full PiP Player
        <>
          {/* Video Player */}
          <div className="relative w-full h-full">
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={volume}
              muted={muted}
              onProgress={handleProgress}
              onDuration={handleDuration}
              controls={false}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0
                  }
                }
              }}
            />

            {/* Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="absolute top-2 left-2 right-2 h-8 cursor-move bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-8 h-1 bg-white/60 rounded-full" />
            </div>

            {/* Controls Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showControls ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/30"
            >
              {/* Top Controls */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMinimize}
                    className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    <MinusIcon className="h-3 w-3 text-white" />
                  </button>
                  
                  <div className="bg-black/50 px-2 py-1 rounded text-xs text-white max-w-32 truncate">
                    {videoTitle}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => changeSize(size === 'small' ? 'medium' : size === 'medium' ? 'large' : 'small')}
                    className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    {size === 'small' ? (
                      <PlusIcon className="h-3 w-3 text-white" />
                    ) : (
                      <ArrowsPointingInIcon className="h-3 w-3 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={onFullscreen}
                    className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    <ArrowsPointingOutIcon className="h-3 w-3 text-white" />
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="p-1.5 bg-black/50 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>

              {/* Center Play/Pause */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-6 w-6 text-white" />
                  ) : (
                    <PlayIcon className="h-6 w-6 text-white ml-1" />
                  )}
                </button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-2 left-2 right-2">
                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1 mb-2">
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="p-1 bg-black/50 hover:bg-black/70 rounded transition-colors"
                    >
                      {muted ? (
                        <SpeakerXMarkIcon className="h-3 w-3 text-white" />
                      ) : (
                        <SpeakerWaveIcon className="h-3 w-3 text-white" />
                      )}
                    </button>
                    
                    {size !== 'small' && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-12 h-1 accent-purple-500"
                      />
                    )}
                  </div>
                  
                  {size === 'large' && (
                    <div className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Kid-friendly visual indicator */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-purple-500 rounded-full opacity-50"
              />
            </div>
          </div>
        </>
      )}
      
      {/* Resize Handles (only for large size) */}
      {size === 'large' && !isMinimized && showControls && (
        <>
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-white/20 rounded-tl-lg" />
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/40 rounded-full" />
        </>
      )}
    </motion.div>
  );
};

export default PictureInPicture;