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
          self._savePostedRecordForAttempt(attempt);
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
  
  _savePostedRecordForAttempt: function(attempt) {
    var self = this;
    
    // Create new execution record
    var record = new this.Models.ExecutionRecord(self.request.json.object);
    record.attemptId = attempt.id();
    record.normalize();
    
    this._findReferenceAndUpdateAttempt(record, attempt, function (correct, referenceRecord) {
      record.correct = correct;
      
      record.save(function () {
        self.render({ json: {status: "SUCCESS", record: {id: record._id}} });
        self.resume();
        
        try {
          self.WebSocket.publishEvent( 'executionRecord',
                                       record.attemptId,
                                       { record: record.__doc,
                                         reference: referenceRecord,
                                         attempt: attempt.__doc } );
        } catch (e) {
          require('sys').log("Exception occurred try to publish execution attempt record event: " + e);
        }
      });
    });
  },
  
  _findReferenceAndUpdateAttempt: function(record, attempt, callback) {
    var self = this;
    
    this.Models.User.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
      if (systemAttempt) {
        var finder = { attemptId: systemAttempt.id(), count: record.count };
        self.Models.ExecutionRecord.find(finder, false).one(function (reference) {
          ++attempt.recordCount;
          
          var errorDescriptor = record.compareToReference(reference || self.Models.ExecutionRecord.getBlankDocument());
          self._updateAttemptWithReferenceDiff(attempt, errorDescriptor);
          
          attempt.save(function() {
            callback(!errorDescriptor[0], reference);
          });
        });
      } else {
        callback(false, null);
      }
    });
  },
  
  _updateAttemptWithReferenceDiff: function(attempt, errorDescriptor) {
    if (errorDescriptor[0]) {
      // Incorrect... update attempt with error counts/types
      ++attempt.incorrectCount;
      
      var errors = errorDescriptor[1];
      var keys = ['registers', 'flags', 'memoryChangeAddresses', 'memoryChangeValues',
                  'operandTypes', 'operandStrings', 'instructionAddressingMode',
                  'instructionSegment', 'instructionOffset', 'instructionMnemonic', 'rawBytes'];
      for (var i = 0, len = keys.length; i < len; ++i) {
        var key = keys[i];
        attempt.errorsByType[key] += errors[key];
      }
    } else {
      // Correct
      ++attempt.correctCount;
    }
  }
  
};