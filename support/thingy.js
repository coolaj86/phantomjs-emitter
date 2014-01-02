(function () {
  //'use strict';

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

    //me._emitRemotely('_browserReady');
    me.emit('_browserReady');
  }

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

    setTimeout(function () {
      me._emitRemotely(event, args);
      me._emitLocally(event, args);
    }, 100);
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
      , fns = me.listeners(event)
      , fn
      , i
      ;

    /*
    me.listeners(event).forEach(function (fn) {
      //fn = window.eval('window.__TMP_FN__ = ' + fn.toString());
      //window.__TMP_FN__(1,'b');
      fn.apply(null, JSON.parse(JSON.stringify(args)));
    });
    */
    for (i = 0; i < fns.length; i += 1) {
      fn = fns[i];
      __hackFn(fn, JSON.parse(JSON.stringify(args)));
    }
  };

  // receive from the phantom instance
  proto.on = function(event, fn) {
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
 
  BrowserPhantomEmitter.create = function (_id) {
    return new BrowserPhantomEmitter(_id);
  };

  BrowserPhantomEmitter.get = function (id) {
    return phantomEmitters[id];
  };

  window.PhantomEmitter = BrowserPhantomEmitter;

  // provide something for phantom to call
  window._emitPhantom = function (id, event, args) {
    var emitter = BrowserPhantomEmitter.get(id)
      ;

    if (emitter) {
      window.callPhantom({ ev: 'evPh', args: args, t: (typeof args).toString() });
      emitter._emitLocally(event, args);
    } else {
      window.callPhantom({ _id: emitter._id, _event: event, _args: args });
    }
  };

  window.__hackFn = function (fn, args) {
    fn(args);
  };
}());
(function () {
  //'use strict';

  window.callPhantom(['phantom is happening', '!']);

  var emitter = new window.PhantomEmitter('foo-emitter')
    ;

  //setInterval(function () {
    emitter.emit('browser', {I: 'AM'}, 'JavaScript');
    emitter.emit('echoBrowser', {You: 'IS'}, 'JavaScript');
  //}, 1000);

  emitter.on('_nodeReady', function (foo, bar, baz) {
    emitter.emit('browser', {I: 'Love'}, 'JavaScript');
    //window.callPhantom({a: ['[browserPhantom] nodePhantom is ready!', foo, bar, baz] });
  });

  var xyz = function (a, b, c) {
    // arguments have disappeared by this time
    window.callPhantom({ ev: 'eventNode', args: {a: 'b', c: [a, b, c]} });
    emitter.emit('echoNode', { b: 'hellololo', a: [a, b, c]});
    //window.callPhantom(['local forPhantom (loopback)', i, love, js]);
  }
  emitter.on('node', xyz);

  emitter.on('browser', function (d, e, f) {
    emitter.emit('echoBrowser', d, e, f);
    //window.callPhantom(['local forPhantom (loopback)', i, love, js]);
  });
}());
