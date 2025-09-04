import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  HeartIcon,
  LightBulbIcon,
  AcademicCapIcon,
  FireIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckSolid,
  XCircleIcon as XSolid,
  StarIcon as StarSolid,
  HeartIcon as HeartSolid
} from '@heroicons/react/24/solid';
import Confetti from 'react-confetti';
import axios from 'axios';

const InteractiveQuiz = ({ videoId, videoData, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lives, setLives] = useState(3);
  const [hints, setHints] = useState(2);
  const [showHint, setShowHint] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // Sample quiz data - would come from API
  const sampleQuestions = [
    {
      id: 1,
      question: "What color was the main character's favorite balloon? 🎈",
      options: ["Red", "Blue", "Green", "Yellow"],
      correct: 0,
      explanation: "Great job! The balloon was bright red, just like the character's cheerful personality! 🎈❤️",
      hint: "Think about the color that represents love and energy!",
      difficulty: "easy",
      category: "Colors",
      image: "/api/placeholder/300/200",
      points: 10
    },
    {
      id: 2,
      question: "How many friends did the character meet on their adventure? 👫",
      options: ["2", "3", "4", "5"],
      correct: 2,
      explanation: "Exactly! They met 4 wonderful friends who each taught them something special! 🌟",
      hint: "Count carefully - there was the wise owl, the funny rabbit, the brave mouse, and the kind deer!",
      difficulty: "medium",
      category: "Story",
      image: "/api/placeholder/300/200",
      points: 15
    },
    {
      id: 3,
      question: "What important lesson did the story teach us? 📚",
      options: ["Always share with others", "Be kind to everyone", "Never give up", "All of the above"],
      correct: 3,
      explanation: "Perfect! The story taught us all these wonderful values that make us better friends! 💖",
      hint: "The story was full of good lessons - maybe it's more than just one!",
      difficulty: "hard",
      category: "Values",
      image: "/api/placeholder/300/200",
      points: 20
    }
  ];

  useEffect(() => {
    initializeQuiz();
  }, [videoId]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const initializeQuiz = async () => {
    try {
      const response = await axios.get(`/api/quiz/video/${videoId}`);
      setQuestions(response.data.questions || sampleQuestions);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setQuestions(sampleQuestions);
    }
  };

  const startQuiz = () => {
    setIsActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setLives(3);
    setHints(2);
    setTimeLeft(30);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setIsActive(false);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct;

    if (isCorrect) {
      const points = currentQuestion.points + (streak * 5); // Bonus for streak
      setScore(score + points);
      setStreak(streak + 1);
      
      // Check for achievements
      checkAchievements(true);
    } else {
      setStreak(0);
      setLives(lives - 1);
      checkAchievements(false);
    }

    // Auto-advance after showing explanation
    setTimeout(() => {
      setShowExplanation(true);
    }, 1500);

    setTimeout(() => {
      nextQuestion();
    }, 4000);
  };

  const handleTimeUp = () => {
    if (!showResult) {
      setShowResult(true);
      setIsActive(false);
      setStreak(0);
      setLives(lives - 1);
      
      setTimeout(() => {
        setShowExplanation(true);
      }, 1500);

      setTimeout(() => {
        nextQuestion();
      }, 4000);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
      setShowHint(false);
      setTimeLeft(30);
      setIsActive(true);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setQuizComplete(true);
    setIsActive(false);
    
    if (score >= questions.length * 15) { // High score
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    onComplete?.({
      score,
      totalQuestions: questions.length,
      correctAnswers: Math.floor(score / 15), // Approximate
      badges: earnedBadges
    });
  };

  const checkAchievements = (isCorrect) => {
    const newBadges = [];

    if (isCorrect && streak === 2) {
      newBadges.push({ id: 'streak3', name: 'Triple Streak!', icon: '🔥' });
    }

    if (isCorrect && streak === 4) {
      newBadges.push({ id: 'streak5', name: 'Amazing Streak!', icon: '⭐' });
    }

    if (newBadges.length > 0) {
      setEarnedBadges([...earnedBadges, ...newBadges]);
    }
  };

  const useHint = () => {
    if (hints > 0 && !showResult) {
      setHints(hints - 1);
      setShowHint(true);
    }
  };

  const getScoreColor = (score) => {
    const percentage = (score / (questions.length * 20)) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEncouragementMessage = () => {
    const percentage = (score / (questions.length * 20)) * 100;
    if (percentage >= 90) return "🌟 Outstanding! You're a quiz superstar!";
    if (percentage >= 70) return "⭐ Excellent work! You really paid attention!";
    if (percentage >= 50) return "👏 Good job! Keep learning and growing!";
    return "🌈 Great effort! Every question helps you learn!";
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion && !quizComplete) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        {showConfetti && <Confetti />}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl text-center"
        >
          <div className="mb-6">
            <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">{getEncouragementMessage()}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score} Points
            </div>
            <div className="flex justify-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <StarSolid 
                  key={i} 
                  className={`h-6 w-6 ${
                    i < Math.floor((score / (questions.length * 20)) * 5) 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {Math.floor((score / (questions.length * 20)) * 100)}% Correct
            </p>
          </div>

          {earnedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">New Badges Earned!</h3>
              <div className="flex justify-center space-x-4">
                {earnedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-yellow-100 rounded-xl p-3 text-center"
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{badge.name}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={startQuiz}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => onComplete?.({ score, totalQuestions: questions.length })}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Continue Learning
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <QuestionMarkCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Interactive Quiz</h1>
              <p className="text-gray-600">Test what you learned!</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${
              timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <ClockIcon className="h-4 w-4" />
              <span className="font-bold">{timeLeft}s</span>
            </div>

            {/* Lives */}
            <div className="flex items-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <HeartSolid 
                  key={i} 
                  className={`h-5 w-5 ${i < lives ? 'text-red-500' : 'text-gray-300'}`} 
                />
              ))}
            </div>

            {/* Score */}
            <div className="bg-yellow-100 text-yellow-600 px-3 py-2 rounded-xl flex items-center space-x-2">
              <TrophyIcon className="h-4 w-4" />
              <span className="font-bold">{score}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 text-center">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-white rounded-2xl p-8 shadow-lg"
      >
        {/* Question Image */}
        {currentQuestion.image && (
          <div className="mb-6">
            <img 
              src={currentQuestion.image}
              alt="Question illustration"
              className="w-full h-48 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Question */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {currentQuestion.difficulty}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
              {currentQuestion.category}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {currentQuestion.question}
          </h2>

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center justify-center space-x-1 mb-4">
              <FireIcon className="h-5 w-5 text-orange-500" />
              <span className="text-orange-600 font-semibold">
                {streak} streak!
              </span>
            </div>
          )}
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start space-x-2">
                <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Hint:</h4>
                  <p className="text-yellow-700">{currentQuestion.hint}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 text-left ${
                showResult
                  ? index === currentQuestion.correct
                    ? 'bg-green-500 text-white transform scale-105'
                    : index === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  : selectedAnswer === index
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && index === currentQuestion.correct && (
                  <CheckSolid className="h-5 w-5" />
                )}
                {showResult && index === selectedAnswer && index !== currentQuestion.correct && (
                  <XSolid className="h-5 w-5" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={useHint}
            disabled={hints === 0 || showResult}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-600 rounded-xl font-semibold hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LightBulbIcon className="h-4 w-4" />
            <span>Hint ({hints})</span>
          </button>

          {showResult && (
            <button
              onClick={nextQuestion}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <span>Next</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-4 rounded-xl ${
                selectedAnswer === currentQuestion.correct
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                <SparklesIcon className={`h-5 w-5 mt-0.5 ${
                  selectedAnswer === currentQuestion.correct ? 'text-green-600' : 'text-blue-600'
                }`} />
                <div>
                  <h4 className={`font-semibold mb-1 ${
                    selectedAnswer === currentQuestion.correct ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {selectedAnswer === currentQuestion.correct ? 'Excellent!' : 'Good try!'}
                  </h4>
                  <p className={selectedAnswer === currentQuestion.correct ? 'text-green-700' : 'text-blue-700'}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default InteractiveQuiz;