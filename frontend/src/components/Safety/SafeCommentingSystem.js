import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  FlagIcon,
  HeartIcon,
  HandThumbsUpIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, HandThumbsUpIcon as ThumbsUpSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import EmojiPicker from 'emoji-mart';

const SafeCommentingSystem = ({ videoId, userId, userAge }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentMode, setCommentMode] = useState('emoji'); // 'emoji', 'safe-text', 'disabled'
  const [isLoading, setIsLoading] = useState(true);
  const [reportingComment, setReportingComment] = useState(null);
  const commentInputRef = useRef(null);

  // Safe emoji list for kids
  const safeEmojis = [
    '😀', '😃', '😄', '😁', '😊', '😍', '🥰', '😘', '🤗', '🤩',
    '😎', '🤓', '🤔', '😇', '🙃', '😋', '😛', '🤪', '🥳', '😴',
    '🤯', '🤠', '🥺', '😻', '😺', '😸', '😹', '🙈', '🙉', '🙊',
    '❤️', '💛', '💚', '💙', '💜', '🧡', '🤍', '🖤', '💖', '💝',
    '⭐', '🌟', '✨', '💫', '🌈', '🦄', '🎉', '🎊', '🎈', '🎁',
    '🏆', '🥇', '🎯', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠', '🎮',
    '🚀', '✈️', '🚁', '🚂', '🚗', '🚕', '🚌', '🚎', '🏎️', '🚓',
    '🦋', '🐝', '🐞', '🐠', '🐡', '🐙', '🐧', '🐨', '🐼', '🦁',
    '🍎', '🍌', '🍓', '🍇', '🍉', '🍊', '🥝', '🍑', '🍒', '🥭',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🥎', '🏸', '🏑'
  ];

  // Pre-approved positive responses
  const quickResponses = [
    'This is awesome! 🌟',
    'So cool! 😎',
    'Love it! ❤️',
    'Amazing! ✨',
    'Super fun! 🎉',
    'Great job! 👏',
    'So funny! 😂',
    'Wow! 🤩',
    'Beautiful! 🌈',
    'Fantastic! 🎊'
  ];

  useEffect(() => {
    fetchComments();
    determineCommentMode();
  }, [videoId, userAge]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/videos/${videoId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const determineCommentMode = () => {
    if (userAge < 6) {
      setCommentMode('emoji');
    } else if (userAge < 13) {
      setCommentMode('safe-text');
    } else {
      setCommentMode('safe-text');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      // AI moderation check
      const moderationResponse = await axios.post('/api/comments/moderate', {
        content: newComment,
        userId,
        videoId
      });

      if (!moderationResponse.data.approved) {
        // Show friendly message for inappropriate content
        showModerationMessage(moderationResponse.data.reason);
        return;
      }

      const response = await axios.post(`/api/videos/${videoId}/comments`, {
        content: newComment,
        userId
      });

      setComments([response.data, ...comments]);
      setNewComment('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const showModerationMessage = (reason) => {
    // Show kid-friendly moderation message
    const messages = {
      inappropriate: "Oops! Let's use kind words that make everyone happy! 😊",
      personal_info: "Remember, we don't share personal information to stay safe! 🛡️",
      spam: "Let's share something new and interesting! ✨",
      negative: "Let's spread positivity and kindness! 🌈"
    };
    
    // You can implement a toast or modal here
    console.log(messages[reason] || "Let's try a different message! 🌟");
  };

  const handleEmojiSelect = (emoji) => {
    setNewComment(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleQuickResponse = (response) => {
    setNewComment(response);
  };

  const handleReaction = async (commentId, reactionType) => {
    try {
      await axios.post(`/api/comments/${commentId}/react`, {
        type: reactionType,
        userId
      });
      
      // Update local state
      setComments(comments.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              reactions: {
                ...comment.reactions,
                [reactionType]: (comment.reactions?.[reactionType] || 0) + 1
              }
            }
          : comment
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReportComment = async (commentId, reason) => {
    try {
      await axios.post(`/api/comments/${commentId}/report`, {
        reason,
        reportedBy: userId
      });
      
      setReportingComment(null);
      // Show success message
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const CommentItem = ({ comment }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {comment.author?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-800">{comment.author?.username}</span>
            {comment.isVerified && (
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
            )}
            <span className="text-xs text-gray-500">{comment.timeAgo}</span>
          </div>
          
          <p className="text-gray-700 mb-3">{comment.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleReaction(comment.id, 'like')}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {comment.userReacted?.like ? (
                  <ThumbsUpSolid className="h-4 w-4 text-blue-600" />
                ) : (
                  <HandThumbsUpIcon className="h-4 w-4" />
                )}
                <span className="text-sm">{comment.reactions?.like || 0}</span>
              </button>
              
              <button
                onClick={() => handleReaction(comment.id, 'love')}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                {comment.userReacted?.love ? (
                  <HeartSolid className="h-4 w-4 text-red-600" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                <span className="text-sm">{comment.reactions?.love || 0}</span>
              </button>
              
              <button
                onClick={() => handleReaction(comment.id, 'star')}
                className="flex items-center space-x-1 text-gray-600 hover:text-yellow-600 transition-colors"
              >
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm">{comment.reactions?.star || 0}</span>
              </button>
            </div>
            
            <button
              onClick={() => setReportingComment(comment.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <FlagIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ReportModal = ({ commentId, onClose }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Report Comment</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">Why are you reporting this comment?</p>
          
          <div className="space-y-3">
            {[
              { reason: 'inappropriate', label: 'Not appropriate for kids', icon: '😟' },
              { reason: 'scary', label: 'Scary or frightening', icon: '😨' },
              { reason: 'mean', label: 'Mean or hurtful', icon: '😢' },
              { reason: 'spam', label: 'Spam or repetitive', icon: '🚫' }
            ].map((option) => (
              <button
                key={option.reason}
                onClick={() => handleReportComment(commentId, option.reason)}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-gray-800">{option.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Comment Input */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-gray-800">Share your thoughts!</h3>
        </div>

        {commentMode !== 'disabled' && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  commentMode === 'emoji' 
                    ? "Add some emojis to show how you feel! 😊"
                    : "Share something positive and kind! ✨"
                }
                className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                maxLength={commentMode === 'emoji' ? 50 : 200}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  <FaceSmileIcon className="h-5 w-5" />
                </button>
                <span className="text-xs text-gray-400">
                  {newComment.length}/{commentMode === 'emoji' ? 50 : 200}
                </span>
              </div>
            </div>

            {/* Quick Responses for younger kids */}
            {commentMode === 'safe-text' && (
              <div className="flex flex-wrap gap-2">
                {quickResponses.map((response, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickResponse(response)}
                    className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm hover:bg-purple-200 transition-colors"
                  >
                    {response}
                  </button>
                ))}
              </div>
            )}

            {/* Safe Emoji Grid for emoji mode */}
            {commentMode === 'emoji' && showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className="grid grid-cols-10 gap-2">
                  {safeEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNewComment(prev => prev + emoji)}
                      className="text-2xl hover:bg-white rounded-lg p-2 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                <span>AI-protected safe space</span>
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comments List */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
          Comments ({comments.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingComment && (
        <ReportModal 
          commentId={reportingComment} 
          onClose={() => setReportingComment(null)} 
        />
      )}
    </div>
  );
};

export default SafeCommentingSystem;