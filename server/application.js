var HTTP = require('http'),
    URL = require('url'),
    SocketIO = require('../vendor/socket.io-node/'),
    Prototype = require('./lib/prototype'),
    Models = require('./models/index'),
    Controllers = require('./controllers/index').initialize({Models: Models, Prototype: Prototype});

var server = HTTP.createServer(function(request, response) {
  var parsedUrl = URL.parse(request.url, true);
  
  Controllers.dispatchToController({
    request: request,
    response: response,
    parsedUrl: parsedUrl
  });
});


server.listen(8080);

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