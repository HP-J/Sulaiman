const path = require('path');

function f(t)
{
  return path.join(__dirname, t);
}

module.exports =
{
  devtool: 'cheap-eval-source-map',
  mode: 'none',
  entry: f('./src/index.js'),
  target: 'electron-main',
  output:
    {
      path: f('/src'),
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