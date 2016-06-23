const gettextToI18next = require('./gettext2json');
const {
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
} = require('./json2gettext');

module.exports = {
  gettextToI18next,
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
};
