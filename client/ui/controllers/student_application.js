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
  },
  
  getTemplatePath: function() {
    return 'home';
  }
  
});