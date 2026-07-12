module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 3's Babel plugin. Must remain the LAST plugin in the list.
    plugins: ['react-native-reanimated/plugin'],
  };
};
