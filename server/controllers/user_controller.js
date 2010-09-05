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
    }
    
    /*
    if (true) { // TODO: Authenticate here...
      // Create new execution attempt record
      var attempt = new this.Models.ExecutionAttempt(this.request.json);
      attempt.save(function() {
        self.render({ json: {status: "SUCCESS", attempt: {id: attempt._id}} });
        self.resume();
      });
    } else {
      this.render({ json: {status: "AUTHENTICATION_FAILURE"} });
      this.resume();
    }
    */
  },
  
  show: function() {
    
  }
  
};