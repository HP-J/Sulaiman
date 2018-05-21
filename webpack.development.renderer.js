const path = require('path');

module.exports =
{
  devtool: 'source-map',
  mode: 'development',
  externals: {
    'vm2': 'require("vm2")'
  },
  entry: './src/renderer/renderer.js',
  target: 'electron-renderer',
  node: {
    __filename: false,
    __dirname: false
  },
  output:
    {
      path: path.join(__dirname, 'src/renderer'),
      publicPath: '/',
      filename: 'bundle.js'
    },
  module:
    {
      rules: 
      [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    }
};