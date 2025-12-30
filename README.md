# app-com

![Node](https://img.shields.io/node/v/app-com.svg?style=flat-square)
[![NPM](https://img.shields.io/npm/v/app-com.svg?style=flat-square)](https://www.npmjs.com/package/app-com)
[![Travis](https://img.shields.io/travis/flndr/app-com/master.svg?style=flat-square)](https://travis-ci.org/flndr/app-com)
[![David](https://img.shields.io/david/flndr/app-com.svg?style=flat-square)](https://david-dm.org/flndr/app-com)
[![Coverage Status](https://img.shields.io/coveralls/flndr/app-com.svg?style=flat-square)](https://coveralls.io/github/flndr/app-com)

> Pub Sub Library for Communication in your App

### Usage

```js
import appCom from 'app-com';

```

### Installation

Install via [yarn](https://github.com/yarnpkg/yarn)

	yarn add app-com (--dev)

or npm

	npm install app-com (--save-dev)


### configuration

You can pass in extra options as a configuration object (➕ required, ➖ optional, ✏️ default).

```js
import appCom from 'app-com';

```

➖ **property** ( type ) ` ✏️ default `
<br/> 📝 description
<br/> ❗️ warning
<br/> ℹ️ info
<br/> 💡 example

### methods

#### #name

```js
appCom

```

### Examples

See [`example`](example/script.js) folder or the [runkit](https://runkit.com/flndr/app-com) example.

### Builds

If you don't use a package manager, you can [access `app-com` via unpkg (CDN)](https://unpkg.com/app-com/), download the source, or point your package manager to the url.

`app-com` is compiled as a collection of [CommonJS](http://webpack.github.io/docs/commonjs.html) modules & [ES2015 modules](http://www.2ality.com/2014/0
  -9/es6-modules-final.html) for bundlers that support the `jsnext:main` or `module` field in package.json (Rollup, Webpack 2)

The `app-com` package includes precompiled production and development [UMD](https://github.com/umdjs/umd) builds in the [`dist` folder](https://unpkg.com/app-com/dist/). They can be used directly without a bundler and are thus compatible with many popular JavaScript module loaders and environments. You can drop a UMD build as a [`<script>` tag](https://unpkg.com/app-com) on your page. The UMD builds make `app-com` available as a `window.appCom` global variable.

### License

The code is available under the [MIT](LICENSE) license.

### Contributing

We are open to contributions, see [CONTRIBUTING.md](CONTRIBUTING.md) for more info.

### Misc

This module was created using [generator-module-boilerplate](https://github.com/duivvv/generator-module-boilerplate).
