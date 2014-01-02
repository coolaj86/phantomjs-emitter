(function () {
  'use strict';

  var PhantomEmitter = require('./index')
    , Phantom = require('node-phantom-simple')
    , fs = require('fs')
    , path = require('path')
    , clientTestJs = path.join(__dirname, 'support', 'browser-test.js')
    ;

  Phantom.create(function (err, phantom) {
    phantom.createPage(function (err, page) {
      page.onCallback = function (obj) {
        console.log('[onCallback]', obj);
      };

      page.onError = function (err) {
        console.error('[error]', err);
      };

      page.open('http://localhost', function (/*err, status*/) {
        
      });

      page.onLoadFinished = function () {
        var emitter = new PhantomEmitter(page, 'foo-emitter', fs.readFileSync(clientTestJs, 'utf8'))
          ;

        setInterval(function () {
          emitter.emit('node', 'Hate', 'cheesecakes');
        }, 3000);

        emitter.on('node', function (a, b) {
          console.log('[node]', a, b);
        });

        emitter.on('echoNode', function (a, b) {
          console.log('[echoNode]', a, b);
        });

        emitter.on('browser', function (a, b) {
          console.log('[browser]', a, b);
        });

        emitter.on('echoBrowser', function (a, b) {
          console.log('[echoBrowser]', a, b);
        });

        /*
        page.evaluate(fs.readFileSync(clientTestJs, 'utf8'), function (err) {
          //emitter.emit
          emitter.on('_browserReady', function () {
            console.log("browser's emitter is ready");
            //emitter.emit('fromPhantom', 'Hate', 'cheesecakes');
          });

          //emitter.emit('fromPhantom2', 'Hate', 'cheesecakes');
        });
        */
      };
    });
  }, { parameters: {} });
}());
