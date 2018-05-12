const path = require('path');

module.exports =
{
  devtool: 'none',
  // devtool: 'cheap-eval-source-map',
  mode: 'production',
  entry: './src/index.js',
  target: 'electron-renderer',
  node: {
    __filename: false,
    __dirname: false
  },
  output:
    {
      path: path.join(__dirname, '/src'),
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
        },
        {
          test: /\.svg$/,
          use: 'svg-loader',
          exclude: /node_modules/
        }
      ]
    }
};