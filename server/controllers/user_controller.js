this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  'new': function() {
    var self = this;
    if (this.request.method == "POST") {
      // Create new user
      var username = this.request.post.username;
      this.Models.User.find({username: username}).one(function (existingUser) {
        var renderUser = function(user) {
          self.render({template: 'user/show', locals: {user: user}});
          self.resume();
        };
        if (existingUser) {
          renderUser(existingUser);
        } else {
          var newUser = new self.Models.User(self.request.post);
          newUser.token = self.SHA1.sha1Hash(username + Math.random());
          newUser.save(function() {
            renderUser(newUser);
          });
        }
      });
    } else if (this.request.method == "GET") {
      // Render the create user template
      this.render({template: 'user/new'});
      this.resume();
    } else {
      this.renderError({errorCode: this.NOT_FOUND});
      this.resume();
    }
  },
  
  show: function() {
    
  }
  
};