var Prototype = require('./lib/prototype'),
    Path = require('path'),
    sys = require('sys');

var environmentConfiguration = {
  dev: {
    port: 3000,
    root: Path.join(Path.dirname(__filename), 'public'),
    templating: {
      cacheOnCompile: false
    },
    db: {
      host: "localhost",
      database: 'db'
    }
  },
  prod: {
    port: 3000,
    root: Path.join(Path.dirname(__filename), 'public'),
    templating: {
      cacheOnCompile: true
    },
    db: {
      host: "localhost",
      database: 'sim86backend'
    }
  }
}

ENVIRONMENT_CONFIG = environmentConfiguration[(process.argv[2] || 'dev')];

if (!ENVIRONMENT_CONFIG) {
  throw new Error("Invalid evironment option");
}

var HTTP = require('http'),
    URL = require('url'),
    SocketIO = require('../vendor/socket.io-node/'),
    Models = require('./models'),
    FS = require('fs'),
    EJS = require('../vendor/visionmedia-ejs'),
    SHA1 = require('./lib/sha1'),
    QueryString = require('querystring'),
    WebSocket = require('./socket/base'),
    Paperboy = require('../vendor/felixge-node-paperboy'),
    Controllers = require('./controllers').initialize({
      Models: Models,
      Prototype: Prototype,
      FS: FS,
      EJS: EJS,
      SHA1: SHA1,
      WebSocket: WebSocket,
      QueryString: QueryString
    });

var server = HTTP.createServer(function(request, response) {
  var ip = request.connection.remoteAddress, url = request.url;
  
  request.on('error', function(exception) {
    try {
      response.end();
    } catch (e) {
      console.log("Could not finalize request in error handler... " + e);
    }
    
    console.log("Exception encountered while handling request: " + exception + "\nStacktrace: " + exception.stack);
  });
  
  var deliverWithPaperboy = function() {
    Paperboy
      .deliver(ENVIRONMENT_CONFIG.root, request, response)
      .addHeader('Expires', 3000)
      .addHeader('X-PaperRoute', 'Node')
      .before(function() {
        sys.log('Received Request for: ' + url);
      })
      .after(function(statCode) {
        sys.log(statCode, url, ip);
      })
      .error(function(statCode, msg) {
        response.writeHead(statCode, {'Content-Type': 'text/plain'});
        response.write("Error: " + statCode);
        response.end();
        sys.log(statCode, url, ip, msg);
      })
      .otherwise(function(err) {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write("Not found");
        response.end();
        sys.log(404, url, ip);
      });
  };
  
  Controllers.dispatchToController({
    request: request,
    response: response,
    parsedUrl: URL.parse(url, true),
    onNoRoute: deliverWithPaperboy
  });
});


server.listen(ENVIRONMENT_CONFIG.port);

WebSocket.initialize.apply(WebSocket, [{
  server: server,
  includes: {
    SocketIO: SocketIO,
    EJS: EJS,
    FS: FS,
    SHA1: SHA1,
    Models: Models,
    Prototype: Prototype
  }
}]);
