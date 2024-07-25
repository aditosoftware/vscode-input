# Change Log

All notable changes to the "vscode-input" module will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 2.0.0

### Added

- LoadingQuickPick: made `placeHolder` available as required element in the options
- QuickPick: added `ignoreFocusOut` as optional element in its options

### Changed

- General: used one title for every input and do not allow to switch the titles for any input component
- InputBox: made `placeHolder` required in the `inputBoxOptions`
- OpenDialog: made `openLabel` required in the `openDialogOptions`
- QuickPick: made `placeHolder` required in the options.
- QuickPickItems: changed property `additionalTitle` to `additionalPlaceholder`. It is now shown in the placeholders instead of the title.

### Removed

- InputBox: removed `title` from the `inputBoxOptions`
- OpenDialog: removed `title` from the `openDialogOptions`
- LoadingQuickPick: removed `loadingTitle` from the options. For loading, the title will stay the same, only the placeHolder will change to a pre-defined value.
- QuickPick: removed `title` from the options
- LoadingQuickPick: removed `title` from the options

## 1.0.4

### Removed

- DialogValues: Removed 'confirmation'-property. Values for confirmation dialogs are available in the 'inputValues'-property

## 1.0.3

### Added

- InputBox: Added the possibility to add a custom button with a given action to any input box

## 1.0.2

### Added

- QuickPick: Added back button
- InputBox: Added back button
- LoadingQuickPick: Added back button

## 1.0.1

### Added

- QuickPick: Added option for placeholder

## 1.0.0

### Added

- Initial release for multi step inputs with
  - ConfirmationDialog
  - InputBox
  - OpenDialog
  - QuickPick
  - LoadingQuickPick
