import { resolve as _resolve } from 'path';
import nodeExternals from 'webpack-node-externals';
import { IgnorePlugin } from 'webpack';

export const entry = './src/lambda.ts';
export const target = 'node';
export const externals = [
  nodeExternals({
    allowlist: [/^@nestjs/, /^typeorm/],
  }),
];
export const module = {
  rules: [
    {
      test: /\.entity\.ts$/,
      use: ['typeorm-loader'],
    },
    {
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
  ],
};
export const resolve = {
  extensions: ['.ts', '.js'],
  symlinks: false,
};
export const output = {
  filename: 'main.js',
  path: _resolve(__dirname, 'dist'),
  libraryTarget: 'commonjs2',
};
export const plugins = [
  new IgnorePlugin({
    checkResource(resource) {
      const lazyImports = [
        '@nestjs/microservices',
        '@nestjs/websockets',
        'cache-manager',
        'class-validator',
        'class-transformer',
      ];
      return lazyImports.includes(resource);
    },
  }),
];
export const optimization = {
  minimize: false, // Disable minification to preserve class names
};
