//= require "../../controller"

Sim.UI.ApplicationController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container) {
    Sim.Messenger.initialize({
      onDisconnect: function() {
        window.location.reload();
      }
    });
    $super(container);
  },
  
  bind: function($super) {
    $super();
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
    
    this.loginController = new Sim.UI.LoginController(this.grab('.login'), {onLogin: function(user) {
      self.currentUser = user;
      self.loginController.destroy();
      delete self.loginController;
      
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
    }});
  },
  
  destroy: function($super) {
    $super();
    this.loginController = null;
  },
  
  getTemplatePath: function() {
    return 'home';
  }
  
});