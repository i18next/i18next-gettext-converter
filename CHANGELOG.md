### 10.2.0

- recognize nested object arrays and handle appropriately  [101](https://github.com/i18next/i18next-gettext-converter/pull/101)

### 10.1.0

- Add foldLength option [97](https://github.com/i18next/i18next-gettext-converter/pull/97)

### 10.0.1

- Due to a refactoring in `gettext-parser`, it now expects translation tables to contain `msgstr` properties as arrays (strings are not allowed anymore). This patch arrifies this property and adds a regression test

### 10.0.0

- Breaking: support node >= 10
- Update all dependencies
- Replace `bluebird` promises with native promises
- Minor refactoring

### 9.2.1

- fix nplurals=1  [92](https://github.com/i18next/i18next-gettext-converter/pull/92)

### 9.2.0

- add ignoreCtx option  [89](https://github.com/i18next/i18next-gettext-converter/pull/89)

### 9.1.0

- add option `persistMsgIdPlural` to merge msgid and msgid_plural (po -> json -> po)

### 9.0.0

- Breaking: this library now throws an error when passed an invalid `po` file in `gettextToI18next`;

### 8.0.2

- fix bug with cli `-f` option [82](https://github.com/i18next/i18next-gettext-converter/pull/82)

### 8.0.1

- fix fuzzy check crash if message has no comments [78](https://github.com/i18next/i18next-gettext-converter/issues/78)

### 8.0.0

- update hebrew plurals

### 7.1.0

- handle fuzzy values as not translated

### 7.0.0

- drop support for node < 6

### 6.1.1

- respect skipUntranslated option when used with keyasareference option [73](https://github.com/i18next/i18next-gettext-converter/pull/73)

### 6.1.0

- add possibility to define custom POT-Creation-Date and PO-Revision-Date [74](https://github.com/i18next/i18next-gettext-converter/pull/74)

### 5.0.0

- Fix [Wrong Plural-Forms for Brazilian Portuguese](https://github.com/i18next/i18next-gettext-converter/issues/67)

### 4.0.3

- Fix -ks and other cli options

### 4.0.2

- Fix --project cli option

### 4.0.1

- Fix broken build

### 4.0.0

- Upgrades to node-gettext@2 (breaking, users may need to update filter option function)
- Adds project option
- Upgrades dependencies
