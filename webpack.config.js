const path = require('path');

module.exports =
{
  devtool: 'cheap-eval-source-map',
  mode: 'none',
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
    },
  plugins:
    [
    ]
};