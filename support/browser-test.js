(function () {
  'use strict';

  var emitter = new window.PhantomEmitter('foo-emitter')
    ;

  emitter.on('_phantomReady', function (foo, bar, baz) {
    window.callPhantom(['phantom is ready!', foo, bar, baz]);
    emitter.emit('forPhantom', 'I', 'Love', 'JavaScript');
  });

  emitter.on('forPhantom', function (i, love, js) {
    window.callPhantom(['local forPhantom (loopback)', i, love, js]);
  });

  emitter.on('fromPhantom', function (a, b) {
    window.callPhantom(['local fromPhantom', a, b]);
  });
}());
