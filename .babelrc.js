const env = process.env.NODE_ENV || 'production';
const plugins = env === 'test' ? ['istanbul'] : [];

module.exports = {
  presets: [['@babel/env', { targets: { node: 6 } }]],
  plugins,
};
