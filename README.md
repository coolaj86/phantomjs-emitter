phantomjs-emitter
=================

An event emitter you can use between the browser and node side of PhantomJS.

Works with in PhantomJS or node with any of the following modules:

  * `node-phantom-simple` (used in the examples given here)
  * `node-phantom` (works, but overcomplicated)
  * `phantom` (isn't very complete, doesn't work very well)

This thin wrapper around `window.callPhantom` and `page.evaluate` has (almost exactly)
the same API as node's `EventEmitter`
allows you to easily build an API between the node and browser parts.

This is particularly useful since you can't easily pass variables back and forth
with `page.evaluate` - which is stringified an therefore can't have closures - or
call local code with `window.callPhantom`.

API
===

Almost exactly the same as NodeJS' EventEmitter API.

  * `once(eventName, fn)`
  * `on(eventName, fn)` (aliased as `addListener`)
  * `off(eventName, fn)` (aliased as `removeListener`)
  * `emit(eventName, arg1, arg2, ...)`
    ** When you emit an event from either the browser or node, that event fires on both sides.
  * `listeners(eventName)`

**NOTE**: The constructors are different.
They both take an optional name (non-optional if multiple emitters are to be used)
and the node-side requires a `page` instance.

Browser Usage
---

`browser-controller.js`:
```javascript
var emitter = new window.PhantomEmitter()
  ;

emitter.on('foo-data', function (data) {
  console.log(data);
});

emitter.on('foo-node', function (data) {
  console.log(data);
});

emitter.emit('foo-browser', "Hello Node, Love Browser");
```

Node Usage
---

`node-controller.js`:
```javascript
var PhantomEmitter = require('phantom-emitter')
  ;

Phantom.create(function (err, phantom) {
  phantom.createPage(function (err, page) {
    var emitter
      ;

    page.open('https://www.google.com')

    page.onLoadFinished = function () {
      emitter = new window.PhantomEmitter(page);

      // fires for both node and browser 'data' events
      emitter.on('foo-data', function (data) {
        console.log(data);
      });

      emitter.on('foo-browser', function (data) {
        console.log(data);
      });

      page.injectJs(__dirname + '/browser-controller.js', function (/*err*/) {
        emitter.emit('foo-node', "Hellow Browser, Love Node");
      });
    };
  });
});
```

Tricks & Hacks
===

As long as the `page` object of whatever module
you're using supports the following methods, you're good.
If not, you'll need to wrap whatever you have to provide that functionality.

  * onCallback
  * evaluate
  * inejectJs

There's an issue where sometimes calling a function in Phantom
will fail to pass arguments, that's why there's some arguments
mangling with the number 42. If you're using this module, you
probably won't encounter that bug. Otherwise you inevitably will.
