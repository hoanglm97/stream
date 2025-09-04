import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircleIcon,
  SparklesIcon,
  SwatchIcon,
  FaceSmileIcon,
  ShirtIcon,
  EyeIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  GiftIcon,
  LockClosedIcon,
  StarIcon,
  HeartIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const AvatarCustomizer = ({ userId, currentAvatar, onSave, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('face');
  const [avatar, setAvatar] = useState({
    face: 'happy',
    skinColor: '#FDBCB4',
    hairStyle: 'short',
    hairColor: '#8B4513',
    eyeColor: '#4169E1',
    outfit: 'casual',
    outfitColor: '#FF6B6B',
    accessory: 'none',
    background: 'rainbow',
    expression: 'smile'
  });
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [savedAvatars, setSavedAvatars] = useState([]);

  const categories = [
    { id: 'face', label: 'Face', icon: FaceSmileIcon },
    { id: 'hair', label: 'Hair', icon: SparklesIcon },
    { id: 'eyes', label: 'Eyes', icon: EyeIcon },
    { id: 'outfit', label: 'Outfit', icon: ShirtIcon },
    { id: 'accessories', label: 'Accessories', icon: StarIcon },
    { id: 'background', label: 'Background', icon: SwatchIcon }
  ];

  const customizationOptions = {
    face: {
      shapes: [
        { id: 'round', name: 'Round', emoji: '😊', cost: 0 },
        { id: 'oval', name: 'Oval', emoji: '😄', cost: 0 },
        { id: 'heart', name: 'Heart', emoji: '😍', cost: 50 },
        { id: 'square', name: 'Square', emoji: '😎', cost: 100 }
      ],
      skinColors: [
        { id: '#FDBCB4', name: 'Light', cost: 0 },
        { id: '#F1C27D', name: 'Medium Light', cost: 0 },
        { id: '#E0AC69', name: 'Medium', cost: 0 },
        { id: '#C68642', name: 'Medium Dark', cost: 0 },
        { id: '#8D5524', name: 'Dark', cost: 0 }
      ]
    },
    hair: {
      styles: [
        { id: 'short', name: 'Short & Sweet', emoji: '✂️', cost: 0 },
        { id: 'long', name: 'Long & Lovely', emoji: '💇‍♀️', cost: 25 },
        { id: 'curly', name: 'Curly Cute', emoji: '🌀', cost: 50 },
        { id: 'braids', name: 'Beautiful Braids', emoji: '👸', cost: 75 },
        { id: 'ponytail', name: 'Playful Ponytail', emoji: '🎀', cost: 50 },
        { id: 'bun', name: 'Neat Bun', emoji: '🥨', cost: 100 }
      ],
      colors: [
        { id: '#8B4513', name: 'Brown', cost: 0 },
        { id: '#FFD700', name: 'Blonde', cost: 0 },
        { id: '#000000', name: 'Black', cost: 0 },
        { id: '#FF6B6B', name: 'Red', cost: 25 },
        { id: '#4ECDC4', name: 'Teal', cost: 50 },
        { id: '#9B59B6', name: 'Purple', cost: 75 },
        { id: '#FF69B4', name: 'Pink', cost: 100 }
      ]
    },
    eyes: {
      colors: [
        { id: '#4169E1', name: 'Blue', cost: 0 },
        { id: '#228B22', name: 'Green', cost: 0 },
        { id: '#8B4513', name: 'Brown', cost: 0 },
        { id: '#9370DB', name: 'Violet', cost: 50 },
        { id: '#FF1493', name: 'Pink', cost: 75 },
        { id: '#FFD700', name: 'Golden', cost: 100 }
      ],
      expressions: [
        { id: 'normal', name: 'Normal', emoji: '👀', cost: 0 },
        { id: 'wink', name: 'Wink', emoji: '😉', cost: 25 },
        { id: 'heart', name: 'Heart Eyes', emoji: '😍', cost: 50 },
        { id: 'star', name: 'Star Eyes', emoji: '🤩', cost: 75 }
      ]
    },
    outfit: {
      styles: [
        { id: 'casual', name: 'Casual Cool', emoji: '👕', cost: 0 },
        { id: 'formal', name: 'Fancy Formal', emoji: '👔', cost: 50 },
        { id: 'superhero', name: 'Super Hero', emoji: '🦸‍♀️', cost: 100 },
        { id: 'princess', name: 'Princess', emoji: '👸', cost: 150 },
        { id: 'pirate', name: 'Pirate', emoji: '🏴‍☠️', cost: 125 },
        { id: 'astronaut', name: 'Space Explorer', emoji: '👨‍🚀', cost: 200 }
      ],
      colors: [
        { id: '#FF6B6B', name: 'Red', cost: 0 },
        { id: '#4ECDC4', name: 'Teal', cost: 0 },
        { id: '#45B7D1', name: 'Blue', cost: 0 },
        { id: '#96CEB4', name: 'Green', cost: 25 },
        { id: '#FFEAA7', name: 'Yellow', cost: 25 },
        { id: '#DDA0DD', name: 'Purple', cost: 50 }
      ]
    },
    accessories: [
      { id: 'none', name: 'None', emoji: '❌', cost: 0 },
      { id: 'glasses', name: 'Cool Glasses', emoji: '🤓', cost: 50 },
      { id: 'hat', name: 'Fun Hat', emoji: '🎩', cost: 75 },
      { id: 'crown', name: 'Royal Crown', emoji: '👑', cost: 150 },
      { id: 'headband', name: 'Cute Headband', emoji: '🎀', cost: 25 },
      { id: 'mask', name: 'Super Mask', emoji: '🎭', cost: 100 }
    ],
    background: [
      { id: 'rainbow', name: 'Rainbow', emoji: '🌈', cost: 0 },
      { id: 'forest', name: 'Magical Forest', emoji: '🌲', cost: 50 },
      { id: 'ocean', name: 'Ocean Waves', emoji: '🌊', cost: 75 },
      { id: 'space', name: 'Starry Space', emoji: '🌌', cost: 100 },
      { id: 'castle', name: 'Fairy Castle', emoji: '🏰', cost: 125 },
      { id: 'garden', name: 'Flower Garden', emoji: '🌸', cost: 50 }
    ]
  };

  useEffect(() => {
    if (currentAvatar) {
      setAvatar({ ...avatar, ...currentAvatar });
    }
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`/api/user/${userId}/avatar-data`);
      setUnlockedItems(response.data.unlockedItems || []);
      setUserPoints(response.data.points || 0);
      setSavedAvatars(response.data.savedAvatars || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set default unlocked items
      setUnlockedItems(['round', 'oval', 'short', 'long', 'casual', 'none', 'rainbow']);
      setUserPoints(250); // Demo points
    }
  };

  const updateAvatar = (category, property, value) => {
    setAvatar(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const purchaseItem = async (itemId, cost) => {
    if (userPoints >= cost) {
      try {
        await axios.post(`/api/user/${userId}/purchase-item`, {
          itemId,
          cost
        });
        
        setUserPoints(userPoints - cost);
        setUnlockedItems([...unlockedItems, itemId]);
      } catch (error) {
        console.error('Error purchasing item:', error);
      }
    }
  };

  const saveAvatar = async () => {
    try {
      await axios.post(`/api/user/${userId}/avatar`, avatar);
      onSave?.(avatar);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const isItemUnlocked = (itemId) => {
    return unlockedItems.includes(itemId) || itemId === 'none' || 
           customizationOptions.face?.skinColors?.some(color => color.id === itemId && color.cost === 0);
  };

  const AvatarPreview = ({ size = 'large' }) => {
    const sizeClass = size === 'large' ? 'w-48 h-48' : 'w-24 h-24';
    
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        {/* Background */}
        <div className={`absolute inset-0 rounded-full ${getBackgroundStyle(avatar.background)}`} />
        
        {/* Face */}
        <div 
          className="absolute inset-4 rounded-full border-4 border-white shadow-lg"
          style={{ backgroundColor: avatar.skinColor }}
        >
          {/* Eyes */}
          <div className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-white">
            <div 
              className="w-3 h-3 rounded-full m-0.5"
              style={{ backgroundColor: avatar.eyeColor }}
            />
          </div>
          <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-white">
            <div 
              className="w-3 h-3 rounded-full m-0.5"
              style={{ backgroundColor: avatar.eyeColor }}
            />
          </div>
          
          {/* Mouth */}
          <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-pink-400 rounded-full" />
          
          {/* Hair */}
          <div 
            className={`absolute -top-2 -left-2 -right-2 h-12 rounded-t-full ${getHairStyle(avatar.hairStyle)}`}
            style={{ backgroundColor: avatar.hairColor }}
          />
        </div>
        
        {/* Accessory */}
        {avatar.accessory !== 'none' && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-2xl">
            {getAccessoryEmoji(avatar.accessory)}
          </div>
        )}
      </div>
    );
  };

  const getBackgroundStyle = (bg) => {
    const styles = {
      rainbow: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400',
      forest: 'bg-gradient-to-b from-green-400 to-green-600',
      ocean: 'bg-gradient-to-b from-blue-300 to-blue-600',
      space: 'bg-gradient-to-b from-purple-900 to-black',
      castle: 'bg-gradient-to-b from-purple-300 to-pink-400',
      garden: 'bg-gradient-to-b from-pink-300 to-green-300'
    };
    return styles[bg] || styles.rainbow;
  };

  const getHairStyle = (style) => {
    const styles = {
      short: 'rounded-t-full',
      long: 'rounded-t-full h-16',
      curly: 'rounded-full',
      braids: 'rounded-t-full',
      ponytail: 'rounded-t-full',
      bun: 'rounded-full h-8'
    };
    return styles[style] || styles.short;
  };

  const getAccessoryEmoji = (accessory) => {
    const emojis = {
      glasses: '🤓',
      hat: '🎩',
      crown: '👑',
      headband: '🎀',
      mask: '🎭'
    };
    return emojis[accessory] || '';
  };

  const CategoryContent = ({ category }) => {
    const options = customizationOptions[category];
    
    if (!options) return null;

    return (
      <div className="space-y-6">
        {Object.entries(options).map(([subCategory, items]) => (
          <div key={subCategory}>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
              {subCategory}
            </h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) => {
                const isUnlocked = isItemUnlocked(item.id);
                const isSelected = avatar[subCategory === 'styles' ? category : subCategory.slice(0, -1)] === item.id ||
                                 avatar[subCategory.slice(0, -5)] === item.id;
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-100' 
                        : isUnlocked 
                        ? 'border-gray-200 bg-white hover:border-purple-300' 
                        : 'border-gray-200 bg-gray-100 opacity-50'
                    }`}
                    onClick={() => {
                      if (isUnlocked) {
                        const property = subCategory === 'styles' ? category : 
                                       subCategory.slice(0, -1) === 'color' ? subCategory : 
                                       subCategory.slice(0, -5);
                        updateAvatar(category, property, item.id);
                      } else if (userPoints >= item.cost) {
                        purchaseItem(item.id, item.cost);
                      }
                    }}
                  >
                    {/* Item Preview */}
                    <div className="text-center">
                      {item.emoji && (
                        <div className="text-2xl mb-2">{item.emoji}</div>
                      )}
                      {item.id.startsWith('#') && (
                        <div 
                          className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-gray-300"
                          style={{ backgroundColor: item.id }}
                        />
                      )}
                      <div className="text-xs font-medium text-gray-700">
                        {item.name}
                      </div>
                      {item.cost > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {isUnlocked ? '✓' : `${item.cost} ⭐`}
                        </div>
                      )}
                    </div>

                    {/* Lock Overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                        <LockClosedIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Purchase Button */}
                    {!isUnlocked && userPoints >= item.cost && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          purchaseItem(item.id, item.cost);
                        }}
                      >
                        Buy
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 to-pink-100 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Avatar Customizer</h1>
              <p className="text-gray-600">Create your unique character!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl px-6 py-3 shadow-lg flex items-center space-x-2">
                <StarSolid className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-gray-800">{userPoints}</span>
                <span className="text-gray-600">points</span>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 shadow-lg sticky top-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Preview</h3>
                
                <AvatarPreview />
                
                <div className="mt-8 space-y-3">
                  <button
                    onClick={saveAvatar}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Save Avatar
                  </button>
                  
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {showPreview ? 'Hide' : 'Show'} Full Preview
                  </button>
                </div>

                {/* Saved Avatars */}
                {savedAvatars.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Saved Looks</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {savedAvatars.slice(0, 6).map((savedAvatar, index) => (
                        <button
                          key={index}
                          onClick={() => setAvatar(savedAvatar)}
                          className="aspect-square border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
                        >
                          <AvatarPreview size="small" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customization Options */}
            <div className="lg:col-span-2">
              {/* Category Tabs */}
              <div className="bg-white rounded-2xl p-2 shadow-lg mb-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        activeCategory === category.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <category.icon className="h-4 w-4 mr-2" />
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Content */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <CategoryContent category={activeCategory} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Amazing Avatar!</h3>
              <div className="scale-150 mb-8">
                <AvatarPreview />
              </div>
              <div className="space-y-3">
                <button
                  onClick={saveAvatar}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  Save & Use This Avatar
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarCustomizer;