// craco.config.js
module.exports = {
  // Configure TypeScript to work with a modern version
  typescript: {
    enableTypeChecking: true
  },
  webpack: {
    configure: (webpackConfig) => {
      // Allow TypeScript 5.x to work with react-scripts 5
      if (webpackConfig.resolve.plugins) {
        const ForkTsCheckerWebpackPlugin = webpackConfig.resolve.plugins.find(
          plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
        );
        
        if (ForkTsCheckerWebpackPlugin) {
          ForkTsCheckerWebpackPlugin.options.typescript.typescriptPath = require.resolve('typescript');
        }
      }
      
      return webpackConfig;
    }
  }
};
