(function () {
  'use strict';

  var PhantomEmitter = require('./index')
    , Phantom = require('node-phantom-simple')
    //, fs = require('fs')
    , path = require('path')
    , clientTestJs = path.join(__dirname, 'support', 'test-phantom.js')
    ;

  Phantom.create(function (err, phantom) {
    phantom.createPage(function (err, page) {
      var emitter = new PhantomEmitter(page, 'foo-emitter')
        ;

      console.log('4', emitter._listeners);
      console.log('5', emitter.listeners('blar'));
      page.open('https://www.facebook.com', function (err, status) {
        console.log('6');
        console.log(emitter.listeners('blar'));

        emitter.on('forPhantom', function (a, b, c, d) {
          console.log('msg forPhantom', a, b, c, d);
        });
        emitter.on('fromPhantom', function (a, b, c, d) {
          console.log('msg fromPhantom (loopback)', a, b, c, d);
        });

        page.injectJs(clientTestJs, function () {
          //emitter.emit
          emitter.on('_phantomReady', function () {
            emitter.emit('fromPhantom', 'Hate', 'cheesecakes');
          });
        });
      });

      page.onCallback = function (a, b, c, d) {
        console.log('onCallback', a, b, c, d);
      };
    });
  }, { parameters: {} });
}());
