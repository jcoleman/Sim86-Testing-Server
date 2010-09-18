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
    client.sendObject({responseId: message.replyId, success: success, object: object});
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
    this.Models.User.find({username: message.object.username}, false).one(function (user) {
      client.user = user;
      if (user) {
        message.reply(true, user);
      } else {
        message.reply(false, {error: "Invalid username"});
      }
    });
  },
  
  'retrieve.attempts': function(client, message) {
    console.log('query: ' + JSON.stringify({userId: client.user._id}));
    this.Models.ExecutionAttempt.find({userId: client.user._id.toHexString()}, false).all(function (attempts) {
      console.log('results: ' + JSON.stringify(attempts));
      message.reply(true, attempts);
    });
  },
  
  'retrieve.executionRecord': function(client, message) {
    var self = this;
    var count = message.object.count;
    var attempt = message.object.attempt;
    
    this.Models.ExecutionRecord.find({attemptId: attempt._id, count: count}, false).one(function (record) {
      self.Models.User.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
        var publish = function(_referenceRecord) {
          try {
            message.reply(true, { record: record,
                                  reference: _referenceRecord });
          } catch (e) {
            require('sys').log("Exception occurred try to reply with execution record: " + e);
          }
        };
        
        if (systemAttempt) {
          self.Models.ExecutionRecord.find({
            attemptId: systemAttempt.id(),
            count: count
          }, false).one(publish);
        } else {
          publish(null);
        }
      });
    });
  },
  
  'subscribe.executionAttempt': function(client, message) {
    if (!this.subscriptions.executionRecord) { this.subscriptions.executionRecord = {}; }
    require('sys').log("Subscribing to feed: executionAttempt with subscription id: " + message.object.attemptId);
    
    var attemptId = message.object.attemptId;
    var subscriptions = this.subscriptions.executionRecord
    if (!subscriptions[attemptId]) {
      subscriptions[attemptId] = [];
    }
    
    if (!subscriptions[attemptId].find(function (it) { return it.client == client; })) {
      subscriptions[attemptId].push({client: client});
    }
  },
  
  'unsubscribe.executionAttempt': function(client, message) {
    var attemptId = message.object.attemptId;
    var subscriptions = this.subscriptions.executionRecord;
    if (subscriptions && subscriptions[attemptId]) {
      subscriptions[attemptId] = subscriptions[attemptId].without.apply(subscriptions[attemptId],
        subscriptions[attemptId].findAll(function (it) { return it.client == client; })
      );
      
      if (subscriptions[attemptId].length == 0) {
        delete subscriptions[attemptId];
      }
    }
  }
  
};


// ----------------------------------------------------------------------------
// External Interface
// ----------------------------------------------------------------------------

this.publishEvent = function(feed, subscriptionIdentifier, object) {
  var feedSubscriptions = this.subscriptions[feed];
  if (feedSubscriptions && feedSubscriptions[subscriptionIdentifier]) {
    require('sys').log("Publishing to feed: " + feed + " with subscription id: " + subscriptionIdentifier);
    feedSubscriptions[subscriptionIdentifier].each(function (subscription) {
      subscription.client.sendObject({ action: 'feed.' + feed,
                                       subscriptionIdentifier: subscriptionIdentifier,
                                       object: object });
    });
    
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
