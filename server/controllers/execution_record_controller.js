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
            
            self.Models.User.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
              var publish = function(_referenceRecord) {
                try {
                  self.WebSocket.publishEvent( 'executionRecord',
                                               record.attemptId,
                                               { record: record.__doc,
                                                 reference: _referenceRecord } );
                } catch (e) {
                  require('sys').log("Exception occurred try to publish execution attempt record event: " + e);
                }
              };
              
              if (systemAttempt) {
                self.Models.ExecutionRecord.find({
                  attemptId: systemAttempt.id(),
                  count: record.count
                }, false).one(publish);
              } else {
                publish(null);
              }
            });
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