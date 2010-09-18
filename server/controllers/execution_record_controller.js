this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
    console.log('complete body: ' + this.request.completeBody);
    if (this.request.json.attemptId) {
      this.Models.ExecutionAttempt.find({_id: this.request.json.attemptId}).one(function(attempt) {
        if (attempt) {
          // Create new execution record
          var record = new self.Models.ExecutionRecord(self.request.json.object);
          record.attemptId = attempt.id();
          record.normalize();
          record.save(function() {
            self.render({ json: {status: "SUCCESS", record: {id: record._id}} });
            self.resume();
            
            self.Models.User.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
              var publish = function(_referenceRecord, _attempt) {
                try {
                  self.WebSocket.publishEvent( 'executionRecord',
                                               record.attemptId,
                                               { record: record.__doc,
                                                 reference: _referenceRecord,
                                                 attempt: _attempt.__doc } );
                } catch (e) {
                  require('sys').log("Exception occurred try to publish execution attempt record event: " + e);
                }
              };
              
              if (systemAttempt) {
                self.Models.ExecutionRecord.find({
                  attemptId: systemAttempt.id(),
                  count: record.count
                }, false).one(function (reference) {
                  ++attempt.recordCount;
                  
                  var errorDescriptor = record.compareToReference(reference || self.ExecutionModel.getBlankDocument());
                  if (errorDescriptor[0]) {
                    // Incorrect... update attempt with error counts/types
                    ++attempt.incorrectCount;
                    self._updateAttemptWithErrors(attempt, errorDescriptor[1]);
                  } else {
                    // Correct
                    ++attempt.correctCount;
                  }
                  
                  attempt.save(function() {
                    publish(reference, attempt);
                  });
                });
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
  },
  
  _updateAttemptWithErrors: function(attempt, errors) {
    var keys = ['registers', 'flags', 'memoryChangeAddresses', 'memoryChangeValues',
                'operandTypes', 'operandStrings', 'instructionAddressingMode',
                'instructionSegment', 'instructionOffset', 'instructionMnemonic', 'rawBytes'];
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      attempt.errorsByType[key] += errors[key];
    }
  }
  
};