(function () {
  'use strict';

  var PhantomEmitter = require('./index')
    , Phantom = require('node-phantom-simple')
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
        var emitter = new PhantomEmitter(page, 'foo-emitter')
          ;

        emitter.on('node', function () {
          var args = [].slice.call(arguments);
          args.unshift('[node]');
          console.log.apply(console, args);
        });

        emitter.on('echoNode', function () {
          var args = [].slice.call(arguments);
          args.unshift('[echoNode]');
          console.log.apply(console, args);
        });

        emitter.on('browser', function () {
          var args = [].slice.call(arguments);
          args.unshift('[browser]');
          console.log.apply(console, args);
        });

        emitter.on('echoBrowser', function () {
          var args = [].slice.call(arguments);
          args.unshift('[echoBrowser]');
          console.log.apply(console, args);
        });

        page.injectJs(clientTestJs, function (/*err*/) {
          emitter.emit('node', 'testing before browser ready event fires');
          emitter.on('_browserReady', function () {
            //console.log("[node]", "browser's emitter is ready");
            emitter.emit('node', "[node]", "browser's emitter is ready");
            
            setInterval(function () {
              emitter.emit('node', 'love', 'cheesecakes');
            }, 3000);
          });

          //emitter.emit('fromPhantom2', 'Hate', 'cheesecakes');
        });
      };
    });
  }, { parameters: {} });
}());
