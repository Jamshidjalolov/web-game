/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Nunito', 'sans-serif'],
        kid: ['"Baloo 2"', 'cursive'],
      },
      boxShadow: {
        soft: '0 24px 60px -28px rgba(14, 116, 144, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pop: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.07)' },
        },
        swing: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        drift: {
          '0%, 100%': {
            transform: 'translate3d(0,0,0)',
          },
          '50%': {
            transform: 'translate3d(0,-10px,0)',
          },
        },
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 0 rgba(14, 165, 233, 0)',
          },
          '50%': {
            boxShadow: '0 0 24px rgba(14, 165, 233, 0.45)',
          },
        },
        enterUp: {
          from: {
            opacity: '0',
            transform: 'translateY(22px) scale(0.98)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pop: 'pop 3.5s ease-in-out infinite',
        swing: 'swing 4s ease-in-out infinite',
        drift: 'drift 7s ease-in-out infinite',
        glow: 'glow 3.2s ease-in-out infinite',
        enterUp: 'enterUp 0.7s ease-out both',
      },
    },
  },
  plugins: [],
}
