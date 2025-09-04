import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PuzzlePieceIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  SparklesIcon,
  TrophyIcon,
  ClockIcon,
  HeartIcon,
  StarIcon,
  XMarkIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import Confetti from 'react-confetti';

const MiniGames = ({ videoData, onClose, onGameComplete }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameData, setGameData] = useState({});
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const games = [
    {
      id: 'quiz',
      title: 'Video Quiz',
      description: 'Answer questions about what you watched!',
      icon: AcademicCapIcon,
      color: 'from-blue-400 to-blue-600',
      difficulty: 'Easy',
      points: 100
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Match images from the video!',
      icon: PuzzlePieceIcon,
      color: 'from-purple-400 to-purple-600',
      difficulty: 'Medium',
      points: 150
    },
    {
      id: 'coloring',
      title: 'Coloring Fun',
      description: 'Color characters from the video!',
      icon: PaintBrushIcon,
      color: 'from-green-400 to-green-600',
      difficulty: 'Easy',
      points: 75
    },
    {
      id: 'puzzle',
      title: 'Jigsaw Puzzle',
      description: 'Put the video scenes back together!',
      icon: SparklesIcon,
      color: 'from-orange-400 to-orange-600',
      difficulty: 'Hard',
      points: 200
    }
  ];

  useEffect(() => {
    if (isGameActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isGameActive, timeLeft]);

  const startGame = async (gameId) => {
    setActiveGame(gameId);
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setIsGameActive(true);
    
    // Fetch game-specific data
    try {
      const response = await fetch(`/api/games/${gameId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: videoData.id })
      });
      const data = await response.json();
      setGameData(data);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  const endGame = () => {
    setIsGameActive(false);
    const gameResult = {
      gameId: activeGame,
      score,
      completed: true,
      timestamp: new Date().toISOString()
    };
    
    setGameHistory([...gameHistory, gameResult]);
    
    if (score > 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    
    onGameComplete?.(gameResult);
  };

  const QuizGame = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    
    const questions = gameData.questions || [
      {
        question: "What color was the main character's hat?",
        options: ["Red", "Blue", "Green", "Yellow"],
        correct: 0,
        image: "/api/placeholder/200/150"
      },
      {
        question: "Where did the adventure take place?",
        options: ["Forest", "Ocean", "Space", "City"],
        correct: 1,
        image: "/api/placeholder/200/150"
      }
    ];

    const handleAnswer = (answerIndex) => {
      setSelectedAnswer(answerIndex);
      setShowResult(true);
      
      setTimeout(() => {
        if (answerIndex === questions[currentQuestion].correct) {
          setScore(score + 20);
        } else {
          setLives(lives - 1);
        }
        
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer(null);
          setShowResult(false);
        } else {
          endGame();
        }
      }, 2000);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {questions[currentQuestion]?.image && (
            <img 
              src={questions[currentQuestion].image}
              alt="Question"
              className="w-full h-40 object-cover rounded-xl mb-4"
            />
          )}
          
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {questions[currentQuestion]?.question}
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {questions[currentQuestion]?.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                  showResult
                    ? index === questions[currentQuestion].correct
                      ? 'bg-green-500 text-white'
                      : index === selectedAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    : selectedAnswer === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MemoryGame = () => {
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [moves, setMoves] = useState(0);

    useEffect(() => {
      initializeCards();
    }, []);

    const initializeCards = () => {
      const images = gameData.images || [
        '/api/placeholder/100/100',
        '/api/placeholder/100/100',
        '/api/placeholder/100/100',
        '/api/placeholder/100/100',
        '/api/placeholder/100/100',
        '/api/placeholder/100/100'
      ];
      
      const cardPairs = [...images, ...images].map((image, index) => ({
        id: index,
        image,
        pairId: Math.floor(index / 2),
        isFlipped: false,
        isMatched: false
      }));
      
      setCards(cardPairs.sort(() => Math.random() - 0.5));
    };

    const handleCardClick = (cardId) => {
      if (flippedCards.length === 2) return;
      
      const card = cards.find(c => c.id === cardId);
      if (card.isFlipped || card.isMatched) return;
      
      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);
      
      setCards(cards.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      ));
      
      if (newFlippedCards.length === 2) {
        setMoves(moves + 1);
        
        setTimeout(() => {
          const [first, second] = newFlippedCards;
          const firstCard = cards.find(c => c.id === first);
          const secondCard = cards.find(c => c.id === second);
          
          if (firstCard.pairId === secondCard.pairId) {
            setMatchedCards([...matchedCards, first, second]);
            setCards(cards.map(c => 
              c.id === first || c.id === second 
                ? { ...c, isMatched: true }
                : c
            ));
            setScore(score + 10);
          } else {
            setCards(cards.map(c => 
              c.id === first || c.id === second 
                ? { ...c, isFlipped: false }
                : c
            ));
          }
          
          setFlippedCards([]);
        }, 1000);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600">Moves: {moves}</p>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card.id)}
              className="aspect-square cursor-pointer"
            >
              <div className="relative w-full h-full">
                <div className={`absolute inset-0 rounded-xl transition-transform duration-500 ${
                  card.isFlipped || card.isMatched ? 'transform rotate-y-180' : ''
                }`}>
                  {/* Card Back */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Card Front */}
                  <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-y-180">
                    <img 
                      src={card.image} 
                      alt="Memory card"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {card.isMatched && (
                      <div className="absolute inset-0 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const ColoringGame = () => {
    const [selectedColor, setSelectedColor] = useState('#FF6B6B');
    const [brushSize, setBrushSize] = useState(5);
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Load coloring template
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = gameData.coloringTemplate || '/api/placeholder/400/400';
      }
    }, [gameData]);

    const handleCanvasClick = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
      ctx.fill();
      
      setScore(score + 1);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="flex space-x-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Brush:</span>
            <input
              type="range"
              min="2"
              max="15"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onClick={handleCanvasClick}
            className="border-2 border-gray-300 rounded-xl cursor-crosshair"
          />
        </div>
      </div>
    );
  };

  const GameCard = ({ game }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => startGame(game.id)}
      className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${game.color} flex items-center justify-center mb-4`}>
        <game.icon className="h-8 w-8 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 mb-2">{game.title}</h3>
      <p className="text-gray-600 mb-4">{game.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">{game.difficulty}</span>
          <div className="flex items-center space-x-1">
            <StarSolid className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{game.points}</span>
          </div>
        </div>
        
        <PlayIcon className="h-5 w-5 text-purple-600" />
      </div>
    </motion.div>
  );

  const renderActiveGame = () => {
    switch (activeGame) {
      case 'quiz':
        return <QuizGame />;
      case 'memory':
        return <MemoryGame />;
      case 'coloring':
        return <ColoringGame />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 to-pink-100 z-50 overflow-y-auto">
      {showConfetti && <Confetti />}
      
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Mini Games</h1>
              <p className="text-gray-600">Have fun while learning!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {activeGame && (
                <>
                  <div className="flex items-center space-x-4 bg-white rounded-2xl px-6 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <TrophyIcon className="h-5 w-5 text-yellow-500" />
                      <span className="font-bold text-gray-800">{score}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-5 w-5 text-blue-500" />
                      <span className="font-bold text-gray-800">{timeLeft}s</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <HeartSolid 
                          key={i} 
                          className={`h-5 w-5 ${i < lives ? 'text-red-500' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveGame(null)}
                    className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-lg transition-colors"
                  >
                    <ArrowPathIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Game Content */}
          {activeGame ? (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl">
              {renderActiveGame()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
          
          {/* Game History */}
          {gameHistory.length > 0 && !activeGame && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameHistory.slice(-6).map((game, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        {games.find(g => g.id === game.gameId)?.title}
                      </span>
                      <div className="flex items-center space-x-1">
                        <TrophyIcon className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-gray-800">{game.score}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(game.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniGames;