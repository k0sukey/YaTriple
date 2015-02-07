# yet another triple

**If there is no compelling thing, please use the [triple](https://github.com/tonylukasavage/triple).**

YaTriple is very simple, does not have nice command of care. Only supports iOS and than anything.

## Why?

In order to ease the iOS native module development. I forgot ```$ titanium.py run```. No more tmp.

```sh
$ ti create --type module --platforms ios --id foo --name foo --workspace-dir . --url http://
$ cd foo/iphone
$ ./build.py
$ yatriple -a ../example/app.js -m ./foo-iphone-1.0.0.zip
```

## Install

```sh
$ npm install yatriple -g
```

## Usage

### Standard

```sh
$ yatriple
```

or

```sh
$ yat
```

When the simulator is launched, will stop at the splash screen. **Take it easy.** That's all right. Please coding the ```Ti.UI.Window```.

### Coping entry point

Do not support load the folder

```sh
$ yatriple -a path/to/app.js
```

### Module load

specify the module id or .zip

```sh
$ yatriple -m path/to/foo-iphone-1.0.0.zip
```

### Option

YaTriple contained [TiWSEvaluateJS](https://github.com/k0sukey/TiWSEvaluateJS). Please use the -P option if you want to specify a port(default 8888).

```sh
$ yatriple -P 8080
```

## Credit

Original idea from [@tonylukasavage](https://github.com/tonylukasavage).