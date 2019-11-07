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
