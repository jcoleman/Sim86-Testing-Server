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

this.subscriptions = {
  executionRecord: {}
};


// ----------------------------------------------------------------------------
// Client Connection Callbacks
// ----------------------------------------------------------------------------

this.onConnection = function(client) {
  // Inject client helpers
  client.sendObject = this.sendObjectToClientAsMessage.curry(client);
  
  client.subscriptions = {
    executionRecord: []
  };
  
  client.getUserId = function() {
    if (client.user) {
      return client.user._id.toHexString();
    } else {
      return null;
    }
  };
  
  
  // Setup connected client callbacks
  client.on('message', this.onClientMessage.bind(this, client));
  client.on('disconnect', this.onClientDisconnect.bind(this, client));
};

this.onClientMessage = function(client, message) {
  var reply = function(success, object) {
    client.sendObject({responseId: message.replyId, success: success, object: object});
  };
  
  try {
    message = JSON.parse(message);
    message.reply = reply;
  } catch (e) {
    reply(false, {error: 'Unable to parse message'});
    return;
  }
  
  var action = this.clientActionImplementations[message.action];
  if (action) {
    try {
      // Execute action
      action.apply(this, [client, message]);
    } catch (e) {
      // Error executing action
      console.log('Exception occurred during action [' + message.action + '] execution: ' + e + '\n' + e.stack);
      message.reply(true, {error: 'Exception occurred during action execution', e: e});
    }
  } else {
    // Invalid action
    message.reply(false, {error: 'Invalid action'});
  }
};

this.onClientDisconnect = function(client) {
  var self = this;
  
  client.subscriptions.executionRecord.each(function (attemptId) {
    var message = { object: {attemptId: attemptId} };
    self.clientActionImplementations['unsubscribe.executionAttempt'].apply(self, [client, message]);
  });
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
    this.Models.ExecutionAttempt.find({userId: client.user._id.toHexString()}, false).all(function (attempts) {
      message.reply(true, attempts);
    });
  },
  
  'retrieve.phases': function(client, message) {
    this.Models.ProjectPhase.find({}, false).all(function (phases) {
      message.reply(true, phases);
    });
  },
  
  'retrieve.attempts.byPhaseSubmission': function(client, message) {
    this.Models.ExecutionAttempt.find({userId: client.user._id.toHexString(), phaseId: message.object.phaseId}, false).all(function (attempts) {
      message.reply(true, attempts);
    });
  },
  
  'retrieve.attempts.admin.byStudent': function(client, message) {
    var self = this;
    this.Models.ExecutionAttempt.find({}, false).all(function (attempts) {
      var usersAttempts = {}, users = {};
      
      attempts.each(function(attempt) {
        var userAttempts = usersAttempts[attempt.userId];
        if (!userAttempts) {
          usersAttempts[attempt.userId] = userAttempts = {};
        }
        userAttempts[attempt.executionModuleId] = attempt;
      });
      
      var userIds = attempts.collect(function (it) { return it.userId.toString(); }).uniq(),
          userCount = 0,
          expectedUserCount = userIds.length;
      
      
      var replyWithSuccessIfReady = function() {
        if (userCount == expectedUserCount) {
          message.reply(true, {
            usersAttempts: usersAttempts,
            users: users
          });
        }
      };
      
      
      userIds.each(function (userId) {
        self.Models.User.find({_id: userId}, false).one(function(user) {
          ++userCount;
          users[user._id.toHexString()] = user;
          replyWithSuccessIfReady();
        });
      });
      
    });
  },
  
  'retrieve.attempts.admin.byPhaseSubmission': function(client, message) {
    var self = this;
    this.Models.ExecutionAttempt.find({phaseId: message.object.phaseId}, false).all(function (attempts) {
      var usersAttempts = {}, systemAttempts = {}, users = {};
      
      attempts.each(function(attempt) {
        var userAttempts = usersAttempts[attempt.userId];
        if (!userAttempts) {
          usersAttempts[attempt.userId] = userAttempts = {};
        }
        userAttempts[attempt.executionModuleId] = attempt;
      });
      
      var moduleIds = attempts.collect(function (it) { return it.executionModuleId; }).uniq(),
          systemAttemptCount = 0,
          expectedSystemAttemptCount = moduleIds.length,
          userIds = attempts.collect(function (it) { return it.userId.toString(); }).uniq(),
          userCount = 0,
          expectedUserCount = userIds.length;
      
      
      var replyWithSuccessIfReady = function() {
        if (userCount == expectedUserCount && systemAttemptCount == expectedSystemAttemptCount) {
          message.reply(true, {
            systemAttempts: systemAttempts,
            usersAttempts: usersAttempts,
            users: users
          });
        }
      };
      
      
      if (moduleIds.length > 0) {
        userIds.each(function (userId) {
          self.Models.User.find({_id: userId}, false).one(function(user) {
            ++userCount;
            users[user._id.toHexString()] = user;
            replyWithSuccessIfReady();
          });
        });
        
        moduleIds.each(function(moduleId) {
          self.Models.ExecutionAttempt.getSystemAttemptForModule(moduleId, function (systemAttempt) {
            systemAttempts[moduleId] = systemAttempt ? systemAttempt.__doc : null;
            ++systemAttemptCount;
            replyWithSuccessIfReady();
          });
        });
      } else {
        message.reply(false, {});
      }
      
    });
  },
  
  'retrieve.modules': function(client, message) {
    this.Models.ExecutionModule.find({}, false).all(function (modules) {
      message.reply(true, modules);
    });
  },
  
  'delete.attempt': function(client, message) {
    var self = this;
    var attemptId = message.object.attemptId;
    this.Models.ExecutionAttempt.find({_id: attemptId}).one(function (attempt) {
      if (attempt) {
        self.Models.ExecutionRecord.remove({attemptId: attemptId}, function () {
          attempt.remove(function() {
            message.reply(true, {});
          });
        });
      } else {
        message.reply(false, {error: "Couldn't find attempt"});
      }
    });
    
  },
  
  'delete.phase': function(client, message) {
    this.Models.ProjectPhase.find({_id: message.object.phaseId}).one(function (phase) {
      if (phase) {
        phase.remove(function() {
          message.reply(true, {});
        });
      } else {
        message.reply(false, {error: "Couldn't find phase"});
      }
    });
  },
  
  'createOrUpdate.phase': function(client, message) {
    var updateAndSave = function(phase) {
      var object = message.object;
      if (object._id) { delete object._id; }
      
      phase.name = object.name;
      phase.dueDate = object.dueDate ? new Date(object.dueDate) : null;
      phase.executionModules = object.executionModules || [];
      
      phase.save(function() {
        message.reply(true, phase);
      });
    };
    
    if (message.object._id) {
      this.Models.ProjectPhase.find({_id: message.object._id}).one(function (phase) {
        if (phase) {
          updateAndSave(phase);
        } else {
          message.reply(false, {error: "Couldn't find phase"});
        }
      });
    } else {
      updateAndSave(new this.Models.ProjectPhase());
    }
  },
  
  'submit.attempt.forPhase': function(client, message) {
    var object = message.object;
    this.Models.ExecutionAttempt.find({userId: client.user._id.toHexString(), _id: object.attemptId}).one(function(attempt) {
      if (attempt) {
        attempt.phaseId = object.phaseId;
        attempt.save(function() {
          message.reply(true, {attempt: attempt});
        });
      } else {
        message.reply(false, {error:'Attempt not found for user'});
      }
    });
  },
  
  'retrieve.executionRecord': function(client, message) {
    var self = this;
    var object = message.object;
    
    var attemptFinder = {_id: object.attemptId, userId: client.getUserId()};
    this.Models.ExecutionAttempt.find(attemptFinder, false).one(function (attempt) {
      if (attempt) {
        var restrictions = object.restrictions;
        restrictions.attemptId = object.attemptId;
        
        self.Models.ExecutionRecord.find(restrictions, false)
                                   .limit(1)
                                   .sort(object.sort || [['count', 1]])
                                   .one(function (record) {
          var publish = function(_referenceRecord) {
            try {
              message.reply(true, { record: record,
                                    reference: _referenceRecord });
            } catch (e) {
              console.log("Exception occurred try to reply with execution record: " + e);
            }
          };
          
          if (record) {
            self.Models.ExecutionAttempt.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
              if (systemAttempt) {
                self.Models.ExecutionRecord.find({
                  attemptId: systemAttempt.id(),
                  count: record.count
                }, false).one(publish);
              } else {
                publish(null);
              }
            });
          } else {
           publish(null); 
          }
        });
      } else {
        message.reply(false, {error: "No attempt found for current user"});
      }
    });
  },
  
  'subscribe.executionAttempt': function(client, message) {
    var attemptId = message.object.attemptId;
    var subscriptions = this.subscriptions.executionRecord;
    if (!subscriptions[attemptId]) {
      subscriptions[attemptId] = [];
    }
    
    if (!subscriptions[attemptId].find(function (it) { return it.client == client; })) {
      subscriptions[attemptId].push({client: client});
      client.subscriptions.executionRecord.push(attemptId);
    }
  },
  
  'unsubscribe.executionAttempt': function(client, message) {
    var attemptId = message.object.attemptId;
    var subscriptions = this.subscriptions.executionRecord;
    if (subscriptions[attemptId]) {
      subscriptions[attemptId] = subscriptions[attemptId].without.apply(subscriptions[attemptId],
        subscriptions[attemptId].findAll(function (it) { return it.client == client; })
      );
      
      if (subscriptions[attemptId].length == 0) {
        client.subscriptions.executionRecord = client.subscriptions.executionRecord.without(attemptId);
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
    feedSubscriptions[subscriptionIdentifier].each(function (subscription) {
      subscription.client.sendObject({ action: 'feed.' + feed,
                                       subscriptionIdentifier: subscriptionIdentifier,
                                       object: object });
    });
    
    return true;
  } else {
    return false;
  }
}.bind(this);


// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

this.sendObjectToClientAsMessage = function(client, object) {
  client.send(Object.toJSON(object));
};
