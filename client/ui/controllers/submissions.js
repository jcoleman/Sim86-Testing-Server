//= require "../../controller"

Sim.UI.SubmissionsController = Class.create(Sim.UI.Controller, {
  
  bind: function($super) {
    var self = this;
    $super();
    
    this.phaseListController = new Sim.UI.ListController(
      this.grab('.phase-list-container'),
      {
        listParent: this.grab('.phase-list'),
        retrieveItems: function(callback) {
          Sim.Messenger.sendRemote('retrieve.phases', {}, function(message) {
            callback(Object.isArray(message.object) ? message.object : []);
          });
        },
        itemTemplate: "phase_list_item",
        onItemRender: function (element, item) {
          element.select('.phase-link').first().observe('click', function(event) {
            if (self.currentPhaseEditor) { self.currentPhaseEditor.destroy(); }
            
            self.currentPhaseEditor = new Sim.UI.SubmissionPhaseEditorController(
              self.grab('.phase-submission-editor'), item
            );
            
            event.stop();
          });
        }
      }
    );
  },
  
  destroy: function($super) {
    if (this.phaseListController) {
      this.phaseListController.destroy();
      delete this.phaseListController;
    }
    
    if (this.currentPhaseEditor) {
      this.currentPhaseEditor.destroy();
      delete this.currentPhaseEditor();
    }
  },
  
  getTemplatePath: function() {
    return 'submission_management';
  }
  
});


Sim.UI.SubmissionPhaseEditorController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, phase) {
    this.phase = phase;
    $super(container);
  },
  
  beforeBind: function(callback) {
    var self = this;
    Sim.Messenger.sendRemote('retrieve.attempts.byPhaseSubmission', {phaseId: this.phase._id}, function(message) {
      
      self.phaseSubmissionAttempts = message.object;
      callback();
    });
  },
  
  bind: function($super) {
    var self = this;
    $super();
    
    this.grab('.submit-current-attempt-link').observe('click', function(event) {
      Sim.Messenger.sendLocal('retrieve.attempt.current', {}, function(message) {
        var attempt = message.object.attempt;
        
        if (attempt) {
          var phaseModuleRequirement = self.phase.executionModules.find(function(it) {
            return it.executionModuleId == attempt.executionModuleId;
          });
          
          if (!phaseModuleRequirement) {
            alert("Currently displayed attempt's file is not required for this phase");
          } /*else if (attempt.phaseId == self.phase._id) {
            alert('Currently displayed attempt already submitted for this phase');
          }*/ else if (attempt.phaseId && attempt.phaseId != self.phase._id) {
            alert('Currently displayed attempt is already submitted for a different phase');
          } else {
            var submitAttempt = function() {
              // We can go ahead an submit the attempt for this phase...
              Sim.Messenger.sendRemote('submit.attempt.forPhase', {phaseId: self.phase._id, attemptId: attempt._id}, function(message) {
                if (message.success) {
                  var element = self.grab('.module-' + attempt.executionModuleId);
                  self.setupSubmittedAttemptLinkage(element, attempt);
                  alert('Successfully submitted attempt for phase');
                } else {
                  alert('Error occurred while submitting attempt for phase');
                }
              });
            };
            
            // Clean out old attempt first if necessary...
            var oldAttempt = self.phaseSubmissionAttempts.find(function(attempt) {
              return attempt.executionModuleId == item.executionModuleId;
            });
            if (oldAttempt) {
              Sim.Messenger.sendRemote('submit.attempt.forPhase', {phaseId: null, attemptId: attempt._id}, function(message) {
                if (message.success) {
                  submitAttempt();
                } else {
                  alert('Error occurred while removing prior attempt from phase');
                }
              });
            } else {
              submitAttempt();
            }
          }
        } else {
          alert('No currently display attempt; cannot submit `null`');
        }
      });
      
      event.stop();
    });
    
    this.moduleListController = new Sim.UI.ListController(
      this.grab('.module-list-container'),
      {
        listParent: this.grab('.module-list'),
        retrieveItems: function(callback) {
          callback(self.phase.executionModules || []);
        },
        itemTemplate: "phase_module_list_item",
        onItemRender: function (element, item) {
          element.addClassName('module-' + item.executionModuleId);
          
          var attempt = self.phaseSubmissionAttempts.find(function(attempt) {
            return attempt.executionModuleId == item.executionModuleId;
          });
          
          self.setupSubmittedAttemptLinkage(element, attempt);
        }
      }
    );
  },
  
  setupSubmittedAttemptLinkage: function(element, attempt) {var self = this;
    var removeSubmissionLink = element.select('.remove-submission-link').first();
    var submittedAttemptLink = element.select('.submitted-attempt-link').first();
    
    submittedAttemptLink.stopObserving('click');
    removeSubmissionLink.stopObserving('click');
    
    if (attempt) {
      submittedAttemptLink.update(attempt._id).observe('click', function(event) {
        Sim.Messenger.sendLocal('display.attempt', attempt);
        
        event.stop();
      });
      removeSubmissionLink.observe('click', function(event) {
        Sim.Messenger.sendRemote('submit.attempt.forPhase', {phaseId: null, attemptId: attempt._id}, function(message) {
          if (message.success) {
            self.setupSubmittedAttemptLinkage(element, null);
            alert('Successfully removed attempt from phase');
          } else {
            alert('Error occurred while removing attempt from phase');
          }
        });
        
        event.stop();
      }).show();
    } else {
      submittedAttemptLink.update('');
      removeSubmissionLink.hide();
    }
  },
  
  destroy: function($super) {
    if (this.moduleListController) {
      this.moduleListController.destroy();
      delete this.moduleListController;
    }
    
    $super();
  },
  
  getTemplatePath: function() {
    return 'submission_phase_editor';
  }
  
});