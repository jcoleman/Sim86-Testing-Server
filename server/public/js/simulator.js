Sim = {};
Sim.UI = {};
Sim.UI.Templates = {};

Sim.UI.Controller = Class.create({
  
  initialize: function(container) {
    this.container = container;
    this.render();
    this.bind();
  },
  
  bind: function() {
    
  },
  
  destroy: function() {
    this.element.remove();
  },
  
  grab: function(selector) {
    return this.element.select(selector).first();
  },
  
  render: function() {
    this.element = new Element(this.tag, this.attributes);
    
    var templatePath = this.getTemplatePath()
    if (templatePath) {
      this.template = new EJS({text: Sim.UI.Templates[templatePath] });
    } else {
      this.template = new EJS({text: ""});
    }
    
    var html = this.template.render(this);
    this.element.update(html);
    
    this.container.insert({bottom: this.element});
  },
  
  getTemplatePath: function() {
    return null;
  },
  
  tag: 'div',
  attributes: {}
  
});
Sim.Messenger = {
  
  
  initialize: function() {
    io.setPath('/client/');
    Sim.Messenger.socket = new io.Socket('localhost', {port:3000});
    Sim.Messenger.socket.connect();
    Sim.Messenger.socket.on('message', function(data) {
      message = data.evalJSON();
      
      var replyId = message.replyId;
      if (replyId) {
        var callback = Sim.Messenger.callbacks[replyId];
        if (callback) {
          callback(message);
        }
      }
    });
  },
  
  send: function(action, object, callback) {
    var replyId = ++Sim.Messenger.currentMessageId;
    
    if (callback) {
      Sim.Messenger.callbacks[replyId] = callback;
    }
    console.log('sending message', action, replyId, object);
    Sim.Messenger.socket.send(Object.toJSON({
      replyId: replyId,
      action: action,
      object: object
    }));
  },
  
  receive: function() {
    
  },
  
  currentMessageId: 1000,
  callbacks: {}
  
};
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
      Sim.Messenger.send('login', {username: username}, function(message) {
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
  
});Sim.UI.Templates['home'] = "<h2>Application Home</h2>\
";
Sim.UI.Templates['login'] = "<h3>Login</h3>\
\
<div>\
    Username: <input type=\"text\" name=\"username\" />\
    <input id=\"login-button\" type=\"button\" value=\"Login\" />\
</div>\
";
