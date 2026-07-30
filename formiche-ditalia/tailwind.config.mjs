import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#f9edd9',
          200: '#f2d7ad',
          300: '#e9b97a',
          400: '#df9545',
          500: '#d67a28',
          600: '#c4601e',
          700: '#a3481b',
          800: '#843a1d',
          900: '#6c311b',
        },
        forest: {
          50: '#f0f7f0',
          100: '#dceddc',
          200: '#bbdcbc',
          300: '#8ec490',
          400: '#5ea762',
          500: '#3d8b41',
          600: '#2d6f32',
          700: '#265a2a',
          800: '#214824',
          900: '#1c3b1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  // Typography is scoped to `.prose`, used only by the blog post bodies under
  // /diario/ — it cannot affect the pages that predate it.
  plugins: [typography],
};
