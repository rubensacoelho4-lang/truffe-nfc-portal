// NOTE (Nomad): pas de plugin react-native-reanimated. Voir CLAUDE.md.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
