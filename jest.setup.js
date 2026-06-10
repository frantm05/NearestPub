/* eslint-env jest */
// AsyncStorage ships a pure-JS mock for Jest; without it any import chain
// touching storage explodes on the missing native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
