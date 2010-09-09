//= require "../../controller"

Sim.UI.ApplicationController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container) {
    Sim.Messenger.initialize();
    $super(container);
  },
  
  bind: function($super) {
    $super();
    
    var self = this;
    this.loginController = new Sim.UI.LoginController(this.element, {onLogin: function(user) {
      self.loginController.destroy();
      self.loginController = null;
      alert("Logged in successfully as '" + user.username + "'");
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