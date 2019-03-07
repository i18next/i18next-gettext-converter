module.exports = api => ({
  presets: [['@babel/env', { targets: { node: 6 } }]],
  plugins: api.env() === 'test' ? ['istanbul'] : [],
});
