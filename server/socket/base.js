var sys = require('sys');

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

this.initialize = function(options) {
  var self = this;
  
  // Add all of the includes as linkages internal to the module
  Object.keys(options.includes || {}).each(function(key) {
    self[key] = options.includes[key];
  });
  
  // Setup the main web socket listener
  var webSocket = this.SocketIO.listen(options.server);
  webSocket.on('connection', this.onConnection.bind(this));
  return this;
};


// ----------------------------------------------------------------------------
// Client Connection Callbacks
// ----------------------------------------------------------------------------

this.onConnection = function(client) {
  sys.log("Client connected:");
  sys.inspect(client);
  
  // Inject client helpers
  client.sendObject = this.sendObjectToClientAsMessage.curry(client);
  
  // Setup connected client callbacks
  client.on('message', this.onClientMessage.bind(this, client));
  client.on('disconnect', this.onClientDisconnect.bind(this, client));
};

this.onClientMessage = function(client, message) {
  var reply = function(success, object) {
    client.sendObject({replyId: message.replyId, success: success, object: object});
  };
  
  console.log('Received message: ' + JSON.stringify(message));
  
  try {
    message = JSON.parse(message);
    message.reply = reply;
  } catch (e) {
    reply(false, {error: 'Unable to parse message'});
    return;
  }
  
  console.log('Executing action: ' + message.action);
  
  var action = this.clientActionImplementations[message.action];
  if (action) {
    try {
      // Execute action
      action.apply(this, [client, message]);
    } catch (e) {
      // Error executing action
      message.reply(true, {error: 'Exception occurred during action execution', e: e});
    }
  } else {
    // Invalid action
    message.reply(false, {error: 'Invalid action'});
  }
};

this.onClientDisconnect = function(client) {
  
};


// ----------------------------------------------------------------------------
// Client Action Callbacks
// ----------------------------------------------------------------------------

this.clientActionImplementations = {
  
  login: function(client, message) {
    this.Models.User.find({username: message.object.username}).one(function (user) {
      client.user = user;
      if (user) {
        message.reply(true, user);
      } else {
        message.reply(false, {error: "Invalid username"});
      }
    });
  },
  
  'retrieve.attempts': function(client, message) {
    this.Models.ExecutionAttempt.find({userId: client.user._id}).all(function (attempts) {
      message.reply(true, attempts);
    });
  },
  
  'subscribe.executionAttempt': function(client, message) {
    if (!this.subscriptions.executionAttempt) { this.subscriptions.executionAttempt = {}; }
    require('sys').log("Subscribing to feed: executionAttempt with subscription id: " + message.object.attemptId);
    this.subscriptions.executionAttempt[message.object.attemptId] = {client: client};
  }
  
};


// ----------------------------------------------------------------------------
// External Interface
// ----------------------------------------------------------------------------

this.publishEvent = function(feed, subscriptionIdentifier, object) {
  var feedSubscriptions = this.subscriptions[feed];
  if (feedSubscriptions && feedSubscriptions[subscriptionIdentifier]) {
    require('sys').log("Publishing to feed: " + feed + " with subscription id: " + subscriptionIdentifier);
    feedSubscriptions[subscriptionIdentifier].client.sendObject({ feed: feed,
                                                                  subscriptionIdentifier: subscriptionIdentifier,
                                                                  object: object });
    return true;
  } else {
    require('sys').log("Unable to publish to feed: " + feed + " with subscription id: " + subscriptionIdentifier);
    return false;
  }
}.bind(this);

this.subscriptions = {
  
};


// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

this.sendObjectToClientAsMessage = function(client, object) {
  client.send(Object.toJSON(object));
};
