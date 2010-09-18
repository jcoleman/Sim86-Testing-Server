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
    
    this.currentInstructionCount = 0;
    this.instructionCache = {};
    
    this.initializeExecutionDisplay();
    
    Sim.Messenger.receive(this, 'feed.executionRecord', function (message) {
      var object = message.object;
      if (self.attempt._id == object.record.attemptId) {
        self.updateInstructionDisplay(object);
      }
    });
    
    this.liveStreamControl = this.grab('.live-feed-control-link');
    this.liveStreamControl.observe('click', function (event) {
      self.liveStream ? self.endLiveStream() : self.beginLiveStream();
      event.stop();
    });
    
    this.beginLiveStream();
    
    this.grab('.previous-instruction-link').observe('click', function (event) {
      self.displayInstructionAtCount(self.currentInstructionCount - 1);
      event.stop();
    });
    
    this.grab('.next-instruction-link').observe('click', function (event) {
      self.displayInstructionAtCount(self.currentInstructionCount + 1);
      event.stop();
    });
  },
  
  initializeExecutionDisplay: function() {
    this.executionDisplayController = new Sim.UI.Execution.DisplayController(this.element);
  },
  
  displayInstructionAtCount: function(count) {
    var self = this;
    if (this.instructionCache[count]) {
      this.updateInstructionDisplay(this.instructionCache[count]);
    } else {
      Sim.Messenger.sendRemote('retrieve.executionRecord', {count: count, attempt: this.attempt}, function (message) {
        var object = message.object;
        if (object.record) {
          self.instructionCache[count] = object;
          self.updateInstructionDisplay(object);
        } else {
          alert('No record found for this attempt with instruction count: ' + count);
        }
      });
    }
  },
  
  updateInstructionDisplay: function(object) {
    this.currentInstructionCount = object.record.count;
    this.executionDisplayController.update(object.record, object.reference);
  },
  
  beginLiveStream: function() {
    this.liveStream = true;
    Sim.Messenger.sendRemote('subscribe.executionAttempt', {attemptId: this.attempt._id});
    this.liveStreamControl.update('Disable live updates');
  },
  
  endLiveStream: function() {
    this.liveStream = false;
    Sim.Messenger.sendRemote('unsubscribe.executionAttempt', {attemptId: this.attempt._id});
    this.liveStreamControl.update('Enable live updates');
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
      message.object.reverse().each(function (attempt) {
        var el = self.renderTemplateIntoElement({
          template: 'attempt_link',
          tag: 'li',
          locals: {attempt: attempt}
        });
        parent.insert({bottom: el});
        el.select('.attempt-link').first().observe('click', function (event) {
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