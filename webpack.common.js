const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const buildDir = path.join(__dirname, 'build');

module.exports = {
  entry: {
    app: './src/app.js',
    neo4j: './src/scripts/neo4j.js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      title: 'Production'
    }),
    new Dotenv()
  ],
  output: {
    filename: '[name].bundle.js',
    path: buildDir,
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ]
  }
};