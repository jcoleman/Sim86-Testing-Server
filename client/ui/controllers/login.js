//= require "../../controller"

Sim.UI.LoginController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    $super(container);
    
    this.onLogin = options.onLogin;
  },
  
  bind: function($super) {
    $super();
    
    var self = this;
    $('login-button').observe('click', function(event) {
      var username = self.grab('[name=username]').value;
      Sim.Messenger.sendRemote('login', {username: username}, function(message) {
        if (message.success) {
          self.onLogin(message.object);
        } else {
          alert(message.object.error);
        }
      });
      event.stop();
    });
  },
  
  getTemplatePath: function() {
    return 'login';
  }
  
});