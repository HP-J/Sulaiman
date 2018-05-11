const path = require('path');

module.exports =
{
  devtool: 'none',
  // devtool: 'cheap-eval-source-map',
  mode: 'production',
  entry: './src/index.js',
  target: 'electron-main',
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
          loader: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    }
};