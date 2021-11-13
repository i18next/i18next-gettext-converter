const { expect } = require('chai');
const {
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
  gettextToI18next,
} = require('..');

describe('cjs', () => {
  it('should require cjs module correctly', () => {
    expect(i18nextToPo).to.be.a('function');
    expect(i18nextToPot).to.be.a('function');
    expect(i18nextToMo).to.be.a('function');
    expect(gettextToI18next).to.be.a('function');
  });
});
