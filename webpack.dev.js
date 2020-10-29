const { merge } = require('webpack-merge');
const { devServer } = require('./webpack.common.js');
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: common.buildDir,
  },
  stats: {
    colors: true,
    reasons: true
  },
});