this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
    
    if (this.request.json.attemptId) {
      this.Models.ExecutionAttempt.find({_id: this.request.json.attemptId}).one(function(attempt) {
        if (attempt) {
          // Create new execution record
          var record = new self.Models.ExecutionRecord(self.request.json.object);
          record.attemptId = attempt.id();
          record.save(function() {
            self.render({ json: {status: "SUCCESS", record: {id: record._id}} });
            self.resume();
            try {
              self.WebSocket.publishEvent('executionAttempt', record.attemptId, {object: record});
            } catch (e) {
              require('sys').log("Exception occurred try to publish execution attempt record event: " + e);
            }
            
          });
        } else {
          self.render({ json: {status: "INVALID_ATTEMPT_ID"} });
          self.resume();
        }
      });
    } else {
      this.render({ json: {status: "INVALID_ATTEMPT_ID"} });
      this.resume();
    }
  }
  
};