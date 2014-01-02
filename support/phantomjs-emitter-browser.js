(function () {
  'use strict';

  var proto
    , phantomEmitters = {}
    ;

  function BrowserPhantomEmitter(_id) {
    if (!(this instanceof BrowserPhantomEmitter)) {
      return new BrowserPhantomEmitter(_id);
    }

    var me = this
      ;

    me._listeners = {};
    me._id = _id || Math.random().toString();
    phantomEmitters[me._id] =  me;

    me._emitRemotely('_phantomReady');
  }

  BrowserPhantomEmitter.create = function (_id) {
    return new BrowserPhantomEmitter(_id);
  };

  BrowserPhantomEmitter.get = function (id) {
    return phantomEmitters[id];
  };

  proto = BrowserPhantomEmitter.prototype;

  // on off once emit listeners hasListeners

  // local listeners
  proto.listeners = function (event) {
    var fns = this._listeners[event]
      ;

    if (!fns) {
      fns = [];
      this._listeners[event] = fns;
    }

    return fns;
  };

  proto.hasListeners = function(event) {
    var me = this
      ;

    return !!me.listeners(event).length;
  };

  // provide a normal emit which sends events to the phantom instance
  proto.emit = function (event) {
    var me = this
      , args = [].slice.call(arguments, 1)
      ;

    me._emitLocally(event, args);
    me._emitRemotely(event, args);
  };
  // provide a special emit for browser to use
  proto._emitRemotely = function (event, args) {
    var me = this
      ;

    window.callPhantom(
      { phantomEmit: event
      , phantomEmitter: me._id
      , phantomArguments: args || []
      }
    );
  };
  // provide a special emit for phantom to use
  proto._emitLocally = function (event, args) {
    var me = this
      ;

    me.listeners(event).forEach(function (fn) {
      fn.apply(null, args);
    });
  };

  // receive from the phantom instance
  proto.on = function (event, fn) {
    var me = this
      ;

    if (!me.listeners(event).some(function (_fn) {
      if (fn === _fn) {
        return true;
      }
    })) {
      me.listeners(event).push(fn);
    }
  };

  // stop receiving
  proto.off = function (event, fn) {
    var me = this
      ;

    me.listeners(event).some(function (_fn, i) {
      if (fn === _fn) {
        me.listeners(event).splice(i, 1);
        return true;
      }
    });
  };

  // call on and then off immediately after
  proto.once = function (event, fn) {
    var me = this
      ;

    function wrappedFn() {
      me.off(event, fn);
      me.off(event, wrappedFn);
    }

    me.on(event, wrappedFn);
    me.on(event, fn);
  };

  window.PhantomEmitter = BrowserPhantomEmitter;

  // provide something for phantom to call
  window._emitPhantom = function (id, event, args) {
    var emitter = BrowserPhantomEmitter.get(id)
      ;

    if (emitter) {
      emitter._emitLocally(event, args);
    }
  };
}());
