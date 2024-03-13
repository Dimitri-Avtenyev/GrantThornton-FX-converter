module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'public/logo_macos.icns',
  },
  rebuildConfig: {},
  makers: [
    // {
    //   name: '@electron-forge/maker-squirrel',
    //   config: {
    //     name: 'GrantThorntonFXconverter',
    //     description: 'GrantThornton FX converter',
    //     iconUrl: 'public/logo.png',
    //   },
    // },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Dimitri-Avtenyev',
          name: 'GrantThornton-FX-converter',
        },
      },
    },
  ],
};
