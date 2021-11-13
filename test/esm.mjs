import { expect } from 'chai';
import {
  gettextToI18next,
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
// https://github.com/import-js/eslint-plugin-import/issues/1649
// eslint-disable-next-line import/no-unresolved,node/no-missing-import
} from 'i18next-conv';

describe('esm module', () => {
  it('should allow named imports', () => {
    expect(gettextToI18next).to.be.a('function');
    expect(i18nextToPo).to.be.a('function');
    expect(i18nextToPot).to.be.a('function');
    expect(i18nextToMo).to.be.a('function');
  });
});
