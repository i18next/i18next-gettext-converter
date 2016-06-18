function noop() {}

function cleanCallback(options, callback) {
  if (typeof options === 'function') {
    callback = options;
  }
  return callback || noop;
}

function cleanOptions(options = {}) {
  return (typeof options === 'function') ? {} : options;
}

module.exports = { cleanCallback, cleanOptions };
