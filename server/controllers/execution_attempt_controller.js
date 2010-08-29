this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
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
  }
  
};