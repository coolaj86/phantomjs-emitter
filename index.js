(function () {
  'use strict';

  var proto
    , path = require('path')
    , phantomEmitters = {}
    , secretObj = {}
    , clientLibPath = path.join(__dirname, 'support', 'phantomjs-emitter-browser.js')
    ;

  function NodePhantomEmitter(page, _id) {
    if (!(this instanceof NodePhantomEmitter)) {
      console.log('1');
      return new NodePhantomEmitter(_id);
    }

    if (NodePhantomEmitter.get(_id) && page === NodePhantomEmitter.get(_id)._page) {
      console.log('2');
      return NodePhantomEmitter.get(_id);
    }

    var me = this
      ;

    me._listeners = {};
    console.log('3', me._listeners);
    me._id = _id || Math.random().toString();
    me._page = page;
    me._initPage(page, function () {
      me._emitLocally('_phantomReady');
    });
    phantomEmitters[me._id] =  me;
  }

  NodePhantomEmitter._initPage = function (page, done) {
    if (page.__phantomEmitter && page.__phantomEmitter.id === secretObj) {
      return;
    }

    page.__phantomEmitter = { id: secretObj, loadedScripts: {} };
    page.__phantomEmitter.rawOnCallback = page.onCallback;
    page.__defineGetter__("onCallback", function () {
      return page.__phantomEmitter.wrappedCallback;
    });
    page.__defineSetter__("onCallback", function (fn) {
      page.__phantomEmitter.rawOnCallback = fn;
    });
    page.__phantomEmitter.wrappedCallback = function (obj) {
      if (!obj || !obj.phantomEmitter) {
        page.__phantomEmitter.rawOnCallback.apply(null, arguments);
        return;
      }

      var emitter = NodePhantomEmitter.get(obj.phantomEmitter)
        ;

      if (emitter) {
        emitter._emitLocally(obj.phantomEmit, obj.phantomArguments);
      }
    };
    page.__phantomEmitter.loadedScripts[clientLibPath] = true;
    page.injectJs(clientLibPath, done);
  };

  NodePhantomEmitter.create = function (_id) {
    return new NodePhantomEmitter(_id);
  };

  NodePhantomEmitter.get = function (id) {
    return phantomEmitters[id];
  };

  proto = NodePhantomEmitter.prototype;

  proto._initPage = NodePhantomEmitter._initPage;

  // on off once emit listeners hasListeners

  // local listeners
  proto.listeners = function (event) {
    console.log('4.3', this._listeners);
    var me = this
      , fns = me._listeners[event]
      ;

    if (!fns) {
      fns = [];
      me._listeners[event] = fns;
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
      , fnStr
      ;

    me._emitLocally(event, args);

    fnStr = 'function () { window._emitPhantom(ID, EVENT, ARGS); }'
      .replace(/ID/, JSON.stringify(me._id))
      .replace(/EVENT/, JSON.stringify(event))
      .replace(/ARGS/, JSON.stringify(args || []))
      ;

    me._page.evaluate(fnStr);
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

  module.exports = NodePhantomEmitter;

  /*
  // provide something for phantom to call
  module.exports._emitPhantom = function (id, event, args) {
    var emitter = NodePhantomEmitter.get(id)
      ;

    if (emitter) {
      emitter._emitLocally(event, args);
    }
  };
  */
}());
