import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  GamepadIcon,
  MicrophoneIcon,
  CloudArrowDownIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  StarIcon,
  FlagIcon,
  BackwardIcon,
  ForwardIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player';

// Import our components
import SafeCommentingSystem from '../Safety/SafeCommentingSystem';
import WatchParty from '../Interactive/WatchParty';
import MiniGames from '../Interactive/MiniGames';
import KaraokeMode from '../Interactive/KaraokeMode';
import InteractiveQuiz from '../Learning/InteractiveQuiz';
import PictureInPicture from '../Advanced/PictureInPicture';
import OfflineManager from '../Advanced/OfflineManager';

const EnhancedVideoPlayer = ({ videoId, videoUrl, videoData, userId, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showKaraoke, setShowKaraoke] = useState(false);
  const [showWatchParty, setShowWatchParty] = useState(false);
  const [showPiP, setShowPiP] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const speedOptions = [0.75, 1, 1.25, 1.5];
  const qualityOptions = ['auto', '360p', '480p', '720p', '1080p'];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, volume]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const toggleMute = () => {
    setMuted(!muted);
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const seekTo = (time) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
      setCurrentTime(time);
    }
  };

  const handleProgress = ({ played, playedSeconds }) => {
    setCurrentTime(playedSeconds);
    
    // Check for AI suggestions at specific timestamps
    checkAISuggestions(playedSeconds);
  };

  const checkAISuggestions = (time) => {
    // Simulate AI suggestions based on video content
    if (Math.floor(time) === 30 && !aiSuggestions.find(s => s.time === 30)) {
      setAiSuggestions(prev => [...prev, {
        time: 30,
        type: 'quiz',
        title: 'Quick Quiz!',
        description: 'Test what you learned so far',
        action: () => setShowQuiz(true)
      }]);
    }
    
    if (Math.floor(time) === 60 && !aiSuggestions.find(s => s.time === 60)) {
      setAiSuggestions(prev => [...prev, {
        time: 60,
        type: 'game',
        title: 'Fun Game!',
        description: 'Play a mini-game about this topic',
        action: () => setShowGames(true)
      }]);
    }
  };

  const addReaction = (emoji) => {
    const newReaction = {
      id: Date.now(),
      emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    };
    
    setReactions(prev => [...prev, newReaction]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ReactionOverlay = () => (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {reactions.map(reaction => (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 1, scale: 0, y: 0 }}
            animate={{ 
              opacity: [1, 1, 0], 
              scale: [0, 1.5, 1], 
              y: -100,
              rotate: [0, 15, -15, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-4xl"
            style={{ left: `${reaction.x}%`, top: `${reaction.y}%` }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const AISuggestionPopup = ({ suggestion }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="absolute top-4 right-4 bg-white rounded-2xl p-4 shadow-2xl max-w-xs z-50"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          {suggestion.type === 'quiz' ? (
            <AcademicCapIcon className="h-5 w-5 text-purple-600" />
          ) : (
            <GamepadIcon className="h-5 w-5 text-purple-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 mb-1">{suggestion.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
          <button
            onClick={suggestion.action}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Try Now!
          </button>
        </div>
      </div>
    </motion.div>
  );

  const ControlsOverlay = () => (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"
        >
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-white font-bold text-lg max-w-md truncate">
                {videoData?.title || 'Video Title'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPiP(true)}
                className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
              >
                <RectangleStackIcon className="h-5 w-5 text-white" />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="h-5 w-5 text-white" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
              >
                <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Center Play/Pause */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="p-6 bg-black/30 hover:bg-black/50 rounded-full transition-all duration-300 transform hover:scale-110"
            >
              {isPlaying ? (
                <PauseIcon className="h-12 w-12 text-white" />
              ) : (
                <PlayIcon className="h-12 w-12 text-white ml-2" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            {/* Progress Bar */}
            <div className="w-full bg-white/30 rounded-full h-2 mb-4 cursor-pointer">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => seekTo(Math.max(0, currentTime - 10))}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <BackwardIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-6 w-6 text-white" />
                  ) : (
                    <PlayIcon className="h-6 w-6 text-white ml-1" />
                  )}
                </button>
                
                <button
                  onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <ForwardIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  {muted ? (
                    <SpeakerXMarkIcon className="h-5 w-5 text-white" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5 text-white" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-purple-500"
                />
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              {/* Interactive Features */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  {isLiked ? (
                    <HeartSolid className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-white" />
                  )}
                </button>
                
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  {isBookmarked ? (
                    <BookmarkSolid className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5 text-white" />
                  )}
                </button>
                
                <button
                  onClick={() => setShowComments(true)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={() => setShowWatchParty(true)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <UserGroupIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={() => setShowGames(true)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <GamepadIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={() => setShowKaraoke(true)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <MicrophoneIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={() => setShowDrawing(true)}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <PaintBrushIcon className="h-5 w-5 text-white" />
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Reaction Buttons */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2">
            {['❤️', '😂', '😍', '🤩', '👏', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={() => addReaction(emoji)}
                className="block p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div 
        ref={containerRef}
        className="relative w-full h-full cursor-pointer"
        onClick={() => setShowControls(true)}
        onMouseMove={() => setShowControls(true)}
      >
        {/* Video Player */}
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={isPlaying}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onDuration={setDuration}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
        />

        {/* Reaction Overlay */}
        <ReactionOverlay />

        {/* Controls Overlay */}
        <ControlsOverlay />

        {/* AI Suggestions */}
        <AnimatePresence>
          {aiSuggestions.map(suggestion => (
            <AISuggestionPopup key={suggestion.time} suggestion={suggestion} />
          ))}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 w-96 h-full bg-white shadow-2xl overflow-y-auto"
            >
              <SafeCommentingSystem
                videoId={videoId}
                userId={userId}
                userAge={8} // This should come from user data
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showWatchParty && (
          <WatchParty
            videoId={videoId}
            videoUrl={videoUrl}
            onClose={() => setShowWatchParty(false)}
          />
        )}

        {showGames && (
          <MiniGames
            videoData={videoData}
            onClose={() => setShowGames(false)}
            onGameComplete={(result) => {
              console.log('Game completed:', result);
              setShowGames(false);
            }}
          />
        )}

        {showKaraoke && (
          <KaraokeMode
            videoId={videoId}
            songData={{ audioUrl: videoUrl }}
            onClose={() => setShowKaraoke(false)}
          />
        )}

        {showQuiz && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full max-h-full overflow-y-auto">
              <InteractiveQuiz
                videoId={videoId}
                videoData={videoData}
                onComplete={(result) => {
                  console.log('Quiz completed:', result);
                  setShowQuiz(false);
                }}
              />
            </div>
          </div>
        )}

        {showOffline && (
          <OfflineManager
            userId={userId}
            onVideoSelect={(video) => {
              console.log('Selected offline video:', video);
              setShowOffline(false);
            }}
            onClose={() => setShowOffline(false)}
          />
        )}
      </div>

      {/* Picture-in-Picture */}
      {showPiP && (
        <PictureInPicture
          videoUrl={videoUrl}
          videoTitle={videoData?.title}
          isActive={showPiP}
          onClose={() => setShowPiP(false)}
          onFullscreen={() => {
            setShowPiP(false);
            // Return to fullscreen video
          }}
        />
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;