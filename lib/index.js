const gettextToI18next = require('./gettext2json');
const {
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
} = require('./json2gettext');

module.exports.gettextToI18next = gettextToI18next;
module.exports.i18nextToPo = i18nextToPo;
module.exports.i18nextToPot = i18nextToPot;
module.exports.i18nextToMo = i18nextToMo;
