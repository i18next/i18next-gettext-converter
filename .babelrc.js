module.exports = ({ env }) => env('test')
  ? { plugins: ['istanbul'] }
  : {};
