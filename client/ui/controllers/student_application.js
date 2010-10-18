//= require "application"

Sim.UI.StudentApplicationController = Class.create(Sim.UI.ApplicationController, {
  
  onLoginSuccess: function() {
    var self = this;
    
    Sim.Messenger.receive(this, 'display.attempt', function (message) {
      if (self.attemptShowController) {
        self.attemptShowController.destroy();
      }
      
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
    
    self.grab('.refresh-attempt-list-link').observe('click', function (event) {
      resetAttemptList();
      event.stop();
    }).show();
    
    resetAttemptList();
  },
  
  getTemplatePath: function() {
    return 'home';
  }
  
});