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
    
    this.loginController = new Sim.UI.LoginController(
      this.grab('.login'),
      {
        onLogin: function(user) {
          self.currentUser = user;
          self.loginController.destroy();
          delete self.loginController;
          
          self.onLoginSuccess();
        }
      }
    );
  },
  
  onLoginSuccess: function() {
    // Override in child controller to actually load the application...
  },
  
  destroy: function($super) {
    $super();
    
    if (this.loginController) {
      this.loginController.destroy();
      delete this.loginController;
    }
  },
  
  getTemplatePath: function() {
    return 'home';
  }
  
});