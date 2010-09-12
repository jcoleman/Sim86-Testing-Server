this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
    
    this.Models.User.find({token: this.request.json.token}).one(function (user) {
      if (user) {
        var filename = (self.request.json.filename || "").toLowerCase();
        self.Models.ExecutionModule.find({filename: filename}).one(function (module) {
          if (module) {
            // Create new execution attempt record
            var attempt = new self.Models.ExecutionAttempt(self.request.json);
            attempt.userId = user.id();
            console.log("got module: " + module.id() + " for attempt");
            attempt.executionModuleId = module.id();
            attempt.save(function() {
              self.render({ json: {status: "SUCCESS", attempt: {id: attempt._id}} });
              self.resume();
            });
          } else {
            self.render({ json: {status: "INVALID_MODULE_FILENAME"} });
            self.resume();
          }
        });
      } else {
        self.render({ json: {status: "AUTHENTICATION_FAILURE"} });
        self.resume();
      }
    });
    
    
  }
  
};