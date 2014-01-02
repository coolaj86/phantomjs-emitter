(function () {
  'use strict';

  var proto
    , path = require('path')
    , phantomEmitters = {}
    , secretObj = {}
    , clientLibPath = path.join(__dirname, 'support', 'phantomjs-emitter-browser.js')
    , fs = require('fs')
    ;

  function NodePhantomEmitter(page, _id) {
    if (!(this instanceof NodePhantomEmitter)) {
      return new NodePhantomEmitter(_id);
    }

    if (NodePhantomEmitter.get(_id) && page === NodePhantomEmitter.get(_id)._page) {
      return NodePhantomEmitter.get(_id);
    }

    var me = this
      ;

    me._listeners = {};
    me._id = _id || Math.random().toString();
    me._page = page;
    me._initPage(page, function () {
      me.emit('_nodeReady');
    });
    phantomEmitters[me._id] =  me;
  }

  NodePhantomEmitter._initPage = function (page, done, jsScript) {
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
      //console.log('wrappedCallback obj', obj);
      if (!obj || !obj.phantomEmitter) {
        if (page.__phantomEmitter.rawOnCallback) {
          //console.log('window.emitter.emit');
          page.__phantomEmitter.rawOnCallback.apply(null, arguments);
        }
        return;
      }

      var emitter = NodePhantomEmitter.get(obj.phantomEmitter)
        ;

      if (emitter) {
        //console.log('window.callPhantom');
        emitter._emitLocally(obj.phantomEmit, obj.phantomArguments);
      }
    };
    page.__phantomEmitter.loadedScripts[clientLibPath] = true;
    /*
    page.evaluate('function () { \n'
      + fs.readFileSync(clientLibPath, 'utf8')
      + ';\n;'
      + jsScript
      + ';\n'
    , done);
    */
    //page.injectJs(fs.readFileSync(clientLibPath, 'utf8'), done);
    
    page.onLoadFinished = function () {
      page.evaluate(fs.readFileSync(
        path.join(__dirname, 'support', 'thingy.js')
      , 'utf8'
      ));
    };
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

    //fnStr = 'function () { window.callPhantom({ _id: ID, _event: EVENT, _args: ARGS }); }'
    fnStr = 'function () { window._emitPhantom(ID, EVENT, ARGS); }'
      .replace(/ID/, JSON.stringify(me._id))
      .replace(/EVENT/, JSON.stringify(event))
      .replace(/ARGS/, JSON.stringify(args || []))
      ;

    setTimeout(function () {
      me._page.evaluate(fnStr, function () {});
    }, 100);
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
}());
