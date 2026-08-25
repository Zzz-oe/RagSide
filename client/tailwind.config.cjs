module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2933',
        line: '#d6dde5',
        paper: '#f7f9fb',
        fern: '#2f7d5f',
        saffron: '#b7791f',
        berry: '#7c3f58'
      },
      boxShadow: {
        panel: '0 1px 2px rgba(31, 41, 51, 0.08)'
      }
    }
  },
  plugins: []
};

