//= require "../../controller"

Sim.UI.ApplicationController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container) {
    Sim.Messenger.initialize();
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
      this.currentUser = user;
      self.loginController.destroy();
      self.loginController = null;
      self.attemptsList = new Sim.UI.Attempt.ListController(self.grab('.attempt-selector'), {});
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