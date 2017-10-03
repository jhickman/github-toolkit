'use strict';
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // eslint-disable-line
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  context: path.resolve(__dirname, ""),
  entry: {
    background: './assets/background',
    options: './assets/options',
    popup: './assets/popup'
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: 'assets'
    }, ], {
      ignore: ['manifest.json'],
    }),

    new CopyWebpackPlugin([{
      from: 'app',
      to: 'app'
    }, {
      from: 'lib',
      to: 'lib'
    }, ])
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },

  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname, "dist"),
      path.resolve(__dirname, "dist/lib")
    ],
    extensions: [".js", ".json", ".jsx", ".css"],
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: [
        path.resolve(__dirname, "node_modules/")
      ],
      use: {
        loader: 'babel-loader'
      }
    }]
  }
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(
    new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        mangle: false,
        output: {
          beautify: true
        }
      }
    })
  );
}
