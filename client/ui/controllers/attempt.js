//= require "../../controller"

Sim.UI.Attempt = {};

Sim.UI.Attempt.ShowController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    this.attempt = options.attempt;
    
    $super(container);
  },
  
  bind: function($super) {
    $super();
    var self = this;
    
    this.initializeExecutionDisplay();
    
    Sim.Messenger.receive(this, 'feed.executionRecord', function (message) {
      var object = message.object;
      if (self.attempt._id == object.record.attemptId) {
        self.executionDisplayController.update(object.record, object.reference);
      }
    });
    
    this.beginLiveStream();
  },
  
  initializeExecutionDisplay: function() {
    this.executionDisplayController = new Sim.UI.Execution.DisplayController(this.element);
  },
  
  beginLiveStream: function() {
    Sim.Messenger.sendRemote('subscribe.executionAttempt', {attemptId: this.attempt._id});
  },
  
  endLiveStream: function() {
    Sim.Messenger.sendRemote('unsubscribe.executionAttempt', {attemptId: this.attempt._id});
  },
  
  destroy: function($super) {
    this.endLiveStream();
    Sim.Messenger.ignore(this, 'feed.executionRecord');
    this.executionDisplayController.destroy();
    $super();
  },
  
  getTemplatePath: function() {
    return 'attempt_show';
  }
  
});

Sim.UI.Attempt.ListController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    $super(container);
    
    this.onSelection = options.onSelection;
  },
  
  bind: function($super) {
    $super();
    
    var self = this;
    var parent = this.grab('.attempt-list');
    Sim.Messenger.sendRemote('retrieve.attempts', {}, function (message) {
      message.object.each(function (attempt) {
        var el = self.renderTemplateIntoElement({
          template: 'attempt_link',
          tag: 'li',
          locals: {attempt: attempt}
        });
        parent.insert({bottom: el});
        self.grab('.' + attempt._id).observe('click', function (event) {
          Sim.Messenger.sendLocal('display.attempt', attempt);
          event.stop();
        });
      });
    });
  },
  
  getTemplatePath: function() {
    return 'attempt_list';
  }
  
});