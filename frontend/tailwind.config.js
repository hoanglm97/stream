/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        }
      },
      fontFamily: {
        'kid-friendly': ['Comic Neue', 'cursive', 'system-ui'],
        'comic': ['Comic Neue', 'cursive'],
        'fredoka': ['Fredoka One', 'cursive'],
        'bubblegum': ['Bubblegum Sans', 'cursive'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'bounce-gentle': 'bounce-gentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'wiggle-slow': 'wiggle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'rainbow': 'rainbow 3s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'heart-beat': 'heart-beat 1s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'confetti': 'confetti 3s ease-out infinite',
        'jiggle': 'jiggle 0.6s ease-in-out',
        'tada': 'tada 1s ease-in-out',
        'rubber-band': 'rubber-band 1s ease-in-out',
        'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        'flip': 'flip 1s ease-in-out',
        'zoom-in': 'zoom-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in-down': 'fade-in-down 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'slide-in-left': 'slide-in-left 0.5s ease-out'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
        rainbow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        'heart-beat': {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotateZ(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-1000px) rotateZ(720deg)', opacity: '0' },
        },
        jiggle: {
          '0%': { transform: 'scale3d(1, 1, 1)' },
          '30%': { transform: 'scale3d(1.25, 0.75, 1)' },
          '40%': { transform: 'scale3d(0.75, 1.25, 1)' },
          '50%': { transform: 'scale3d(1.15, 0.85, 1)' },
          '65%': { transform: 'scale3d(.95, 1.05, 1)' },
          '75%': { transform: 'scale3d(1.05, .95, 1)' },
          '100%': { transform: 'scale3d(1, 1, 1)' },
        },
        tada: {
          '0%': { transform: 'scale3d(1, 1, 1)' },
          '10%, 20%': { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)' },
          '30%, 50%, 70%, 90%': { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' },
          '40%, 60%, 80%': { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' },
          '100%': { transform: 'scale3d(1, 1, 1)' },
        },
        'rubber-band': {
          '0%': { transform: 'scale3d(1, 1, 1)' },
          '30%': { transform: 'scale3d(1.25, 0.75, 1)' },
          '40%': { transform: 'scale3d(0.75, 1.25, 1)' },
          '50%': { transform: 'scale3d(1.15, 0.85, 1)' },
          '65%': { transform: 'scale3d(.95, 1.05, 1)' },
          '75%': { transform: 'scale3d(1.05, .95, 1)' },
          '100%': { transform: 'scale3d(1, 1, 1)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        flip: {
          '0%': { transform: 'perspective(400px) rotateY(0)' },
          '40%': { transform: 'perspective(400px) translateZ(150px) rotateY(170deg)' },
          '50%': { transform: 'perspective(400px) translateZ(150px) rotateY(190deg) scale(1)' },
          '80%': { transform: 'perspective(400px) rotateY(360deg) scale(.95)' },
          '100%': { transform: 'perspective(400px) scale(1)' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale3d(.3, .3, .3)' },
          '50%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translate3d(0, 100%, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translate3d(0, -100%, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'slide-in-right': {
          '0%': { transform: 'translate3d(100%, 0, 0)', visibility: 'visible' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translate3d(-100%, 0, 0)', visibility: 'visible' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        }
      },
      backgroundImage: {
        'rainbow-gradient': 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
        'kid-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'magic-gradient': 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      },
      backgroundSize: {
        'rainbow': '400% 400%',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 105, 180, 0.3)',
        'glow-blue': '0 0 20px rgba(79, 195, 247, 0.3)',
        'kid': '0 8px 32px rgba(139, 92, 246, 0.12)',
        'magical': '0 4px 20px rgba(255, 154, 158, 0.3)',
      },
      colors: {
        kid: {
          pink: '#FF69B4',
          blue: '#4FC3F7',
          green: '#81C784',
          yellow: '#FFD54F',
          purple: '#BA68C8',
          orange: '#FFB74D',
          red: '#E57373',
          teal: '#4DB6AC',
        }
      }
    },
  },
  plugins: [],
}