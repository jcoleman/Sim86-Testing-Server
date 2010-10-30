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
    
    this.cacheDisplayElements();
    
    this.currentInstructionCount = 0;
    this.instructionCache = {};
    
    this.initializeExecutionDisplay();
    
    Sim.Messenger.receive(this, 'feed.executionRecord', function (message) {
      var object = message.object;
      if (self.attempt._id == object.record.attemptId) {
        self.updateDisplays(object);
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
    
    this.grab('.previous-incorrect-instruction-link').observe('click', function (event) {
      self.retrieveAndDisplayInstruction({
        count: {"$lt": self.currentInstructionCount},
        correct: false
      }, [['count', -1]]);
      event.stop();
    });
    
    this.grab('.next-incorrect-instruction-link').observe('click', function (event) {
      self.retrieveAndDisplayInstruction({
        count: {"$gt": self.currentInstructionCount},
        correct: false
      }, [['count', 1]]);
      event.stop();
    });
    
    this.updateAttemptDetails(this.attempt);
  },
  
  initializeExecutionDisplay: function() {
    this.executionDisplayController = new Sim.UI.Execution.DisplayController(this.grab('.execution-display-container'));
  },
  
  displayInstructionAtCount: function(count) {
    if (this.instructionCache[count]) {
      this.updateDisplays(this.instructionCache[count]);
    } else {
      this.retrieveAndDisplayInstruction({count: count});
    }
  },
  
  retrieveAndDisplayInstruction: function(restrictions, sort) {
    var self = this;
    var object = {attemptId: this.attempt._id, restrictions: restrictions, sort: sort};
    Sim.Messenger.sendRemote('retrieve.executionRecord', object, function (message) {
      var object = message.object;
      if (object.record) {
        self.instructionCache[object.record.count] = object;
        self.updateDisplays(object);
      } else {
        alert('No execution record found for query');
      }
    });
  },
  
  updateDisplays: function(object) {
    this.currentInstructionCount = object.record.count;
    
    if (object.attempt) { this.updateAttemptDetails(object.attempt); }
    this.executionDisplayController.update(object.record, object.reference);
  },
  
  updateAttemptDetails: function(attempt) {
    for (var i = 0, len = this.attemptCountsKeys.length; i < len; ++i) {
      var key = this.attemptCountsKeys[i];
      this.elementCache.counts[key].update(attempt[key]);
    }
    
    for (var i = 0, len = this.attemptErrorKeys.length; i < len; ++i) {
      var key = this.attemptErrorKeys[i];
      this.elementCache.errors[key].update(attempt.errorsByType[key]);
    }
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
  
  elementCache: {},
  
  attemptErrorKeys: [
    'registers', 'cf', 'pf', 'af', 'zf', 'sf', 'tf', 'if', 'df', 'of',
    'memoryChangeAddresses', 'memoryChangeValues',
    'operandTypes', 'operandStrings', 'instructionAddressingMode',
    'instructionSegment', 'instructionOffset', 'instructionMnemonic', 'rawBytes'
  ],
  
  attemptCountsKeys: [
    'recordCount', 'correctCount', 'incorrectCount'
  ],
  
  cacheDisplayElements: function() {
    var self = this;
    
    this.elementCache.errors = {};
    this.attemptErrorKeys.each(function (key) {
      self.elementCache.errors[key] = self.grab('.attempt-error-' + key);
    });
    
    this.elementCache.counts = {};
    this.attemptCountsKeys.each(function (key) {
      self.elementCache.counts[key] = self.grab('.attempt-count-' + key);
    });
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
      message.object.each(function (it) {
        it.createdAt = Date.parse(it.createdAt.substring(0, 19));
      });
      
      message.object.sortBy(function (it) { return it.createdAt; }).reverse().each(function (attempt) {
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