import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  StarIcon,
  HeartIcon,
  TrophyIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  LanguageIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const KaraokeMode = ({ videoId, songData, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [micVolume, setMicVolume] = useState(0.7);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showSettings, setShowSettings] = useState(false);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  // Sample lyrics data - would come from API
  const sampleLyrics = [
    { start: 0, end: 3, text: "🎵 Welcome to our magical world 🎵", highlight: false },
    { start: 3, end: 6, text: "Where dreams come alive and stories unfold", highlight: false },
    { start: 6, end: 9, text: "Every color bright and bold", highlight: false },
    { start: 9, end: 12, text: "🌟 Sing along with me 🌟", highlight: false },
    { start: 12, end: 15, text: "Let your voice be free", highlight: false },
    { start: 15, end: 18, text: "In this land of harmony", highlight: false }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' }
  ];

  useEffect(() => {
    initializeKaraoke();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          updateCurrentLyric(audioRef.current.currentTime);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const initializeKaraoke = async () => {
    try {
      // Fetch lyrics and audio data
      const response = await axios.get(`/api/karaoke/${videoId}`);
      setLyrics(response.data.lyrics || sampleLyrics);
      setDuration(response.data.duration || 60);
      
      // Initialize audio context for pitch detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedBlob(event.data);
        }
      };
      
    } catch (error) {
      console.error('Error initializing karaoke:', error);
    }
  };

  const updateCurrentLyric = (time) => {
    const currentIndex = lyrics.findIndex(lyric => 
      time >= lyric.start && time < lyric.end
    );
    
    if (currentIndex !== -1 && currentIndex !== currentLyricIndex) {
      setCurrentLyricIndex(currentIndex);
      
      // Update lyrics highlighting
      setLyrics(lyrics.map((lyric, index) => ({
        ...lyric,
        highlight: index === currentIndex
      })));
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (isRecording) {
          mediaRecorderRef.current.pause();
        }
      } else {
        audioRef.current.play();
        if (isRecording) {
          mediaRecorderRef.current.resume();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } else {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      calculateFinalScore();
    }
  };

  const calculateFinalScore = () => {
    // Simulate score calculation based on timing and pitch accuracy
    const baseScore = Math.floor(Math.random() * 20) + 80; // 80-100
    setFinalScore(baseScore);
    setShowScore(true);
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 95) return "🌟 Superstar! Amazing performance!";
    if (score >= 90) return "⭐ Fantastic! You're a natural!";
    if (score >= 80) return "🎵 Great job! Keep singing!";
    if (score >= 70) return "👏 Good effort! Practice makes perfect!";
    return "🎤 Nice try! Keep having fun!";
  };

  const LyricDisplay = () => (
    <div className="bg-black/70 rounded-2xl p-8 text-center min-h-[200px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {lyrics.map((lyric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: lyric.highlight ? 1 : 0.5,
              y: 0,
              scale: lyric.highlight ? 1.1 : 1
            }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-2xl font-bold mb-4 transition-all duration-300 ${
              lyric.highlight 
                ? 'text-yellow-300 drop-shadow-lg' 
                : 'text-white'
            }`}
          >
            {lyric.text}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Bouncing music notes */}
      <div className="absolute top-4 left-4">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <MusicalNoteIcon className="h-6 w-6 text-yellow-400" />
        </motion.div>
      </div>
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
        >
          <MusicalNoteIcon className="h-6 w-6 text-pink-400" />
        </motion.div>
      </div>
    </div>
  );

  const ProgressBar = () => (
    <div className="bg-white/20 rounded-full h-3 mb-4">
      <div 
        className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all duration-300"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );

  const ScoreModal = () => (
    <AnimatePresence>
      {showScore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="mb-6">
              <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Performance Complete!</h3>
              <p className="text-gray-600">{getScoreMessage(finalScore)}</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(finalScore)}`}>
                {finalScore}/100
              </div>
              <div className="flex justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarSolid 
                    key={i} 
                    className={`h-6 w-6 ${
                      i < Math.floor(finalScore / 20) ? 'text-yellow-400' : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Timing & Pitch Accuracy</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowScore(false);
                  setCurrentTime(0);
                  setScore(0);
                  seekTo(0);
                }}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Sing Again
              </button>
              
              <button
                onClick={() => {
                  // Save performance logic here
                  setShowScore(false);
                  onClose();
                }}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Save Performance
              </button>
              
              <button
                onClick={() => setShowScore(false)}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Continue Singing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SettingsPanel = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute top-0 right-0 w-80 h-full bg-white rounded-l-2xl shadow-2xl p-6 z-40"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Volume Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Music Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Microphone Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={micVolume}
                onChange={(e) => setMicVolume(parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
            
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Instrumental Mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Instrumental Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstrumental}
                  onChange={(e) => setIsInstrumental(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 z-50 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            animate={{
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="relative h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <MicrophoneIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Karaoke Mode</h1>
              <p className="text-white/80">Sing along and have fun!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Lyrics Display */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="w-full max-w-4xl relative">
              <LyricDisplay />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <ProgressBar />
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">{formatTime(currentTime)}</span>
              <span className="text-white font-medium">{formatTime(duration)}</span>
            </div>
            
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <BackwardIcon className="h-6 w-6 text-white" />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <PauseIcon className="h-8 w-8 text-white" />
                ) : (
                  <PlayIcon className="h-8 w-8 text-white ml-1" />
                )}
              </button>
              
              <button
                onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <ForwardIcon className="h-6 w-6 text-white" />
              </button>
              
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <MicrophoneIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Real-time Score */}
            <div className="flex items-center justify-center space-x-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{score}</div>
                <div className="text-sm text-white/80">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
                <div className="text-sm text-white/80">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={songData?.audioUrl || '/api/placeholder/audio.mp3'}
        volume={volume}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
      />

      {/* Settings Panel */}
      <SettingsPanel />
      
      {/* Score Modal */}
      <ScoreModal />
    </div>
  );
};

export default KaraokeMode;