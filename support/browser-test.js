//function BrowserTest() {
(function BrowserTest() {
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
//}
