//=require "core"

Sim.Messenger = {
  
  // This is purposefully NOT a class... so initialize should be called (only once)
  // manually prior to usage.
  
  initialize: function() {
    io.setPath('/client/');
    Sim.Messenger.socket = new io.Socket('localhost', {port:3000});
    Sim.Messenger.socket.connect();
    Sim.Messenger.socket.on('message', function(data) {
      var message = data.evalJSON();
      
      var replyId = message.replyId;
      if (replyId) {
        var callback = Sim.Messenger.callbacks[replyId];
        if (callback) {
          callback(message);
        }
      }
    });
  },
  
  send: function(action, object, callback) {
    var replyId = ++Sim.Messenger.currentMessageId;
    
    if (callback) {
      Sim.Messenger.callbacks[replyId] = callback;
    }
    console.log('sending message', action, replyId, object);
    Sim.Messenger.socket.send(Object.toJSON({
      replyId: replyId,
      action: action,
      object: object
    }));
  },
  
  receive: function() {
    
  },
  
  currentMessageId: 1000,
  callbacks: {}
  
};