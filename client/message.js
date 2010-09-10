//=require "core"

Sim.Messenger = {
  
  // This is purposefully NOT a class... so initialize should be called (only once)
  // manually prior to usage.
  
  initialize: function() {
    io.setPath('/client/');
    Sim.Messenger.socket = new io.Socket('localhost', {port:3000});
    Sim.Messenger.socket.connect();
    Sim.Messenger.socket.on('message', Sim.Messenger._processRemoteMessage);
  },
  
  sendLocal: function(action, object, callback, responseId) {
    var message = new Sim.Message('local', action, object, null, responseId);
    
    if (callback) {
      Sim.Messenger.callbacks[message.replyId] = callback;
    }
    
    console.log('Sending message', action, message.replyId, object);
    Sim.Messenger._emitToReceivers(message);
    
    return message;
  },
  
  sendRemote: function(action, object, callback, responseId) {
    var message = new Sim.Message('remote', action, object, null, responseId);
    
    if (callback) {
      Sim.Messenger.callbacks[message.replyId] = callback;
    }
    
    console.log('Sending message', action, message.replyId, object);
    Sim.Messenger.socket.send( Object.toJSON(message) );
    
    return message;
  },
  
  receive: function(discriminator, action, callback) {
    var receivers = Sim.Messenger.receivers;
    
    var actionReceivers = receivers[action];
    if (!actionReceivers) {
      actionReceivers = receivers[action] = [];
    }
    
    var receiver = actionReceivers.find(function (_receiver) {
      return _receiver.discriminator == discriminator;
    });
    
    if (!receiver) {
      receiver = { discriminator: discriminator, callbacks: [] };
      actionReceivers.push(receiver);
    }
    
    receiver.callbacks.push(callback);
  },
  
  ignore: function(discriminator, action) {
    if (Sim.Messenger.receivers[action]) {
      Sim.Messenger.receivers[action] = Sim.Messenger.receivers[action].without(function (receiver) {
        return receiver.discriminator == discriminator;
      });
    }
  },
  
  _processRemoteMessage: function(data) {
    var parsed = data.evalJSON();
    
    var message = new Sim.Message('remote', parsed.action, parsed.object, parsed.replyId, parsed.responseId);
    message.success = parsed.success;
    
    console.log("Processing remote message", parsed, message);
    Sim.Messenger._fireCallbackFor(message);
    Sim.Messenger._emitToReceivers(message);
  },
  
  _emitToReceivers: function(message) {
    if (message.action) {
      var receivers = Sim.Messenger.receivers[message.action];
      console.log("receivers:", receivers);
      if (receivers) {
        receivers.each(function (receiver) {
          receiver.callbacks.each(function (callback) {
            if (callback) { callback(message); }
          });
        });
      }
    }
  },
  
  _fireCallbackFor: function(message) {
    var responseId = message.responseId;
    if (responseId) {
      var callback = Sim.Messenger.callbacks[responseId];
      if (callback) {
        callback(message);
      }
      delete Sim.Messenger.callbacks[responseId];
    }
  },
  
  _currentMessageId: 1000,
  
  receivers: {},
  
  callbacks: {}
  
};

Sim.Message = Class.create({
  
  initialize: function(type, action, object, replyId, responseId) {
    this.type = type;
    this.action = action;
    this.object = object;
    this.responseId = responseId;
    this.replyId = replyId || this._nextMessageId();
  },
  
  reply: function(object, callback) {
    if (this.type == 'remote') {
      Sim.Messenger.sendRemote(null, object, callback, this.replyId);
    } else if (this.type == 'local') {
      Sim.Messenger.sendLocal(null, object, callback, this.replyId);
    }
  },
  
  _currentMessageId: 1000,
  
  _nextMessageId: function() {
    console.log('creating new message id', Sim.Messenger._currentMessageId + 1);
    return ++Sim.Messenger._currentMessageId;
  }
  
});