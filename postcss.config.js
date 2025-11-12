// postcss.config.cjs
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},  // ← ここが "tailwindcss": {} ではダメ
    autoprefixer: {},
  },
};
