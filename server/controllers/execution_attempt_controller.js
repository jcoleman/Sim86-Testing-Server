this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
    
    this.Models.User.find({token: this.request.json.token}).one(function (user) {
      if (user) {
        // Create new execution attempt record
        var attempt = new this.Models.ExecutionAttempt(this.request.json);
        attempt.userId = user._id;
        attempt.save(function() {
          self.render({ json: {status: "SUCCESS", attempt: {id: attempt._id}} });
          self.resume();
        });
      } else {
        self.render({ json: {status: "AUTHENTICATION_FAILURE"} });
        self.resume();
      }
    });
    
    
  }
  
};