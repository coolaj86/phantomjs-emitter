(function () {
  'use strict';

  window.callPhantom(['phantom is happening', '!']);

  var emitter = new window.PhantomEmitter('foo-emitter')
    ;

  emitter.emit('browser', 'firing event before node ready fires');

  emitter.on('_nodeReady', function () {
    emitter.emit('browser', '[nodeReady]', {I: 'Love'}, 'JavaScript');
  });

  emitter.on('node', function () {
    var args = [].slice.call(arguments)
      ;
    args.unshift('echoNode');
    emitter.emit.apply(emitter, args);
  });

  emitter.on('browser', function () {
    var args = [].slice.call(arguments)
      ;
    args.unshift('echoBrowser');
    emitter.emit.apply(emitter, args);
  });
}());
