import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserGroupIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  HeartIcon,
  StarIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player';
import io from 'socket.io-client';
import axios from 'axios';

const WatchParty = ({ videoId, videoUrl, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const playerRef = useRef(null);
  const chatRef = useRef(null);

  // Fun avatars for participants
  const avatarStyles = [
    'from-purple-400 to-pink-400',
    'from-blue-400 to-cyan-400',
    'from-green-400 to-emerald-400',
    'from-orange-400 to-red-400',
    'from-indigo-400 to-purple-400',
    'from-yellow-400 to-orange-400',
    'from-pink-400 to-rose-400',
    'from-teal-400 to-green-400'
  ];

  useEffect(() => {
    initializeWatchParty();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeWatchParty = async () => {
    try {
      // Create or join room
      const response = await axios.post('/api/watch-party/create', {
        videoId,
        videoUrl
      });
      
      const { roomId: newRoomId, inviteCode: newInviteCode } = response.data;
      setRoomId(newRoomId);
      setInviteCode(newInviteCode);
      setIsHost(true);

      // Initialize socket connection
      const newSocket = io('/watch-party', {
        query: { roomId: newRoomId, videoId }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('participants-updated', (participantsList) => {
        setParticipants(participantsList);
      });

      newSocket.on('video-state-changed', ({ isPlaying: playing, currentTime: time }) => {
        if (playerRef.current) {
          setIsPlaying(playing);
          setCurrentTime(time);
          if (playing) {
            playerRef.current.seekTo(time);
          }
        }
      });

      newSocket.on('chat-message', (message) => {
        setChatMessages(prev => [...prev, message]);
        scrollChatToBottom();
      });

      newSocket.on('reaction-sent', (reaction) => {
        setReactions(prev => [...prev, { ...reaction, id: Date.now() + Math.random() }]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
      });

    } catch (error) {
      console.error('Error initializing watch party:', error);
    }
  };

  const joinRoom = async (code) => {
    try {
      const response = await axios.post('/api/watch-party/join', {
        inviteCode: code
      });
      
      const { roomId: joinRoomId } = response.data;
      setRoomId(joinRoomId);
      setIsHost(false);

      // Connect to existing room
      const newSocket = io('/watch-party', {
        query: { roomId: joinRoomId, videoId }
      });

      setSocket(newSocket);
      setIsConnected(true);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handlePlayPause = () => {
    if (isHost && socket) {
      const newPlayState = !isPlaying;
      const time = playerRef.current?.getCurrentTime() || 0;
      
      socket.emit('video-control', {
        action: newPlayState ? 'play' : 'pause',
        currentTime: time
      });
      
      setIsPlaying(newPlayState);
    }
  };

  const handleSeek = (time) => {
    if (isHost && socket) {
      socket.emit('video-control', {
        action: 'seek',
        currentTime: time
      });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const message = {
        text: newMessage,
        user: 'Current User', // Replace with actual user data
        timestamp: new Date().toISOString(),
        avatar: avatarStyles[Math.floor(Math.random() * avatarStyles.length)]
      };
      
      socket.emit('chat-message', message);
      setNewMessage('');
    }
  };

  const sendReaction = (type) => {
    if (socket) {
      const reaction = {
        type,
        user: 'Current User',
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      
      socket.emit('send-reaction', reaction);
    }
  };

  const scrollChatToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    // Show toast notification
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Watch Party!',
          text: `Come watch with me! Use code: ${inviteCode}`,
          url: `${window.location.origin}/watch-party/${inviteCode}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyInviteCode();
    }
  };

  const ReactionAnimation = ({ reaction }) => (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0 }}
      animate={{ 
        opacity: [1, 1, 0], 
        y: -100, 
        scale: [0, 1.2, 1],
        rotate: [0, 10, -10, 0]
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3, ease: "easeOut" }}
      className="absolute pointer-events-none text-4xl z-50"
      style={{ 
        left: `${reaction.x}%`, 
        top: `${reaction.y}%` 
      }}
    >
      {reaction.type}
    </motion.div>
  );

  const ParticipantAvatar = ({ participant, index }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="relative"
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${avatarStyles[index % avatarStyles.length]} flex items-center justify-center shadow-lg`}>
        <span className="text-white font-bold text-sm">
          {participant.name?.charAt(0).toUpperCase()}
        </span>
      </div>
      {participant.isHost && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <StarIcon className="h-2 w-2 text-yellow-800" />
        </div>
      )}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          {participant.name}
        </span>
      </div>
    </motion.div>
  );

  const InviteModal = () => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowInviteModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Invite Friends!</h3>
            <button 
              onClick={() => setShowInviteModal(false)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className="bg-purple-100 rounded-2xl p-6 mb-4">
              <p className="text-sm text-gray-600 mb-2">Share this code:</p>
              <div className="text-3xl font-bold text-purple-600 mb-4">{inviteCode}</div>
              <button
                onClick={copyInviteCode}
                className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
          
          <button
            onClick={shareInvite}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <ShareIcon className="h-5 w-5" />
            <span>Share Invite</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Video Player */}
        <div className="relative h-full">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={muted}
            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
          
          {/* Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {reactions.map((reaction) => (
                <ReactionAnimation key={reaction.id} reaction={reaction} />
              ))}
            </AnimatePresence>
          </div>

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
                <div className="flex items-center space-x-2 text-white">
                  <UserGroupIcon className="h-5 w-5" />
                  <span className="font-semibold">{participants.length} watching</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isHost && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Invite</span>
                  </button>
                )}
                <div className="flex items-center space-x-1">
                  {participants.slice(0, 4).map((participant, index) => (
                    <ParticipantAvatar key={participant.id} participant={participant} index={index} />
                  ))}
                  {participants.length > 4 && (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                      +{participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isHost ? (
                  <button
                    onClick={handlePlayPause}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6 text-white" />
                    ) : (
                      <PlayIcon className="h-6 w-6 text-white ml-1" />
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-gray-600/50 rounded-full">
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6 text-gray-300" />
                    ) : (
                      <PlayIcon className="h-6 w-6 text-gray-300 ml-1" />
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
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
                  className="w-20 accent-purple-600"
                />
              </div>
              
              {/* Reaction Buttons */}
              <div className="flex items-center space-x-2">
                {['❤️', '😂', '😍', '🤩', '👏', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="w-80 bg-white flex flex-col"
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Chat
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-2"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${message.avatar} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">
                    {message.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {message.user}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{message.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Say something nice..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={100}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Chat Toggle Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="absolute top-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </button>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Connecting to watch party...</p>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && <InviteModal />}
    </div>
  );
};

export default WatchParty;