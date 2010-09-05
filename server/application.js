var Prototype = require('./lib/prototype');

var environmentConfiguration = {
  dev: {
    templating: {
      cacheOnCompile: false
    }
  },
  prod: {
    templating: {
      cacheOnCompile: true
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
    Models = require('./models/index'),
    FS = require('fs'),
    EJS = require('../vendor/visionmedia-ejs/index'),
    SHA1 = require('./lib/sha1'),
    QueryString = require('querystring'),
    Controllers = require('./controllers/index').initialize({
      Models: Models,
      Prototype: Prototype,
      FS: FS,
      EJS: EJS,
      SHA1: SHA1,
      QueryString: QueryString
    });

var server = HTTP.createServer(function(request, response) {
  var parsedUrl = URL.parse(request.url, true);
  
  Controllers.dispatchToController({
    request: request,
    response: response,
    parsedUrl: parsedUrl
  });
});


server.listen(3000);

var webSocket = SocketIO.listen(server);

webSocket.on('connection', function(client) {
  // new client is here!
  client.on('message', function(message) {
    console.log(message +  " from " + client);
    //var object = JSON.parse(message);
    //User.
  });
  client.on('disconnect', function() { console.log("disconnected:", client) })
});