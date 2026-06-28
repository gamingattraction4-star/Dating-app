module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its Babel plugin via react-native-worklets.
    // This must remain the LAST plugin in the list.
    plugins: ['react-native-worklets/plugin'],
  };
};
