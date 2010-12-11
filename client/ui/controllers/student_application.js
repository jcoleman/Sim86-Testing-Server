//= require "application"

Sim.UI.StudentApplicationController = Class.create(Sim.UI.ApplicationController, {
  
  onLoginSuccess: function() {
    var self = this;
    this.currentAttempt = null;
    
    Sim.Messenger.receive(this, 'retrieve.attempt.current', function (message) {
      console.log("received request for currently display attempt");
      message.reply({attempt: self.currentAttempt});
    });
    
    Sim.Messenger.receive(this, 'display.attempt', function (message) {
      if (self.attemptShowController) {
        self.attemptShowController.destroy();
      }
      
      self.currentAttempt = message.object;
      
      self.attemptShowController = new Sim.UI.Attempt.ShowController(
        self.grab('.attempt-display'),
        {attempt: message.object}
      );
    });
    
    var resetAttemptList = function() {
      if (self.attemptsList) {
        self.attemptsList.destroy();
        delete self.attemptsList;
      }
      self.attemptsList = new Sim.UI.Attempt.ListController(self.grab('.attempt-selector'), {});
    };
    
    Sim.Messenger.receive(this, 'delete.attempt', function (message) {
      var attempt = message.object;
      Sim.Messenger.sendRemote('delete.attempt', {attemptId: attempt._id}, function(message) {
        if (message.success) {
          alert('Attempt removed successfully.')
          resetAttemptList();
        } else {
          alert('Error occurred while removing attempt: ' + message.object.error);
        }
      });
    });
    
    this.grab('.refresh-attempt-list-link').observe('click', function (event) {
      resetAttemptList();
      event.stop();
    }).show();
    
    resetAttemptList();
    
    var submissionsLink = this.grab('.manage-phase-submissions-link');
    submissionsLink.observe('click', function (event) {
      submissionsLink.hide();
      
      self.submissionsController = new Sim.UI.SubmissionsController(
        self.grab('.submission-management')
      );
    }).show();
    
  },
  
  destroy: function($super) {
    if (this.submissionsController) {
      this.submissionsController.destroy();
      delete this.submissionsController;
    }
    
    Sim.Messenger.ignore(this, 'retrieve.attempt.current');
    Sim.Messenger.ignore(this, 'display.attempt');
    Sim.Messenger.ignore(this, 'delete.attempt');
  },
  
  getTemplatePath: function() {
    return 'home';
  }
  
});