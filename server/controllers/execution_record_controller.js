this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  'new': function() {
    var self = this;
    
    // Verify data structure...
    var json = this.request.json;
    var object = json.object = json.object_ || json.object;
    var structureErrors = [];
    if (!object || object.toString() !== '[object Object]') {
      structureErrors.push('`object_` was either not found or not a map.');
    } else {
      if (!object.instruction || object.instruction.toString() !== '[object Object]') {
        structureErrors.push('`object.instruction` was either not found or not a map.');
      } else {
        var instruction = object.instruction;
        if (instruction.operands === null) {
          instruction.operands = [];
        } else if (instruction.operands === undefined || !Object.isArray(instruction.operands)) {
          structureErrors.push('`object.instruction.operands` was either not found or not an array.');
        } else {
          var operands = instruction.operands;
          for (var i = 0, len = operands.length; i < len; ++i) {
            if (!operands[i] || operands[i].toString() !== '[object Object]') {
              structureErrors.push('`object.instruction.operands[' + i + ']` was either null, undefined, or not an object.');
            } else {
              operands[i].string = operands[i].string_ || operands[i].string;
              
              if (!operands[i].string || typeof(operands[i].string) != 'string') {
                structureErrors.push('`object.instruction.operands[' + i + '].string` (or ._string) was not a string.');
              }
              
              if (!operands[i].type || typeof(operands[i].type) != 'string') {
                structureErrors.push('`object.instruction.operands[' + i + '].type` was not a string.');
              }
            }
          }
        }
        
        if (instruction.rawBytes === null) {
          instruction.rawBytes = [];
        } else if (instruction.rawBytes === undefined || !Object.isArray(instruction.rawBytes)) {
          structureErrors.push('`object.instruction.rawBytes` was either not found or not an array.');
        }
      }
      
      if (!object.registers || object.registers.toString() !== '[object Object]') {
        structureErrors.push('`object.registers` was either not found or not a map.');
      }
      
      if (!object.memory || object.memory.toString() !== '[object Object]') {
        structureErrors.push('`object.memory` was either not found or not a map.');
      } else {
        var memory = object.memory;
        if (memory.changes === null) {
          memory.changes = [];
        } else if (memory.changes === undefined || !Object.isArray(memory.changes)) {
          structureErrors.push('`object.memory.changes` was either not found or not an array.');
        } else {
          var changes = memory.changes;
          for (var i = 0, len = changes.length; i < len; ++i) {
            if (!changes[i] || changes[i].toString() !== '[object Object]') {
              structureErrors.push('`object.memory.changes[' + i + ']` was either not found or not a map.');
            }
          }
        }
      }
    }
    
    if (structureErrors.length > 0) {
      this.render({ json: {status: "INVALID_OBJECT_STRUCTURE", errors: structureErrors} });
      this.resume();
    } else {
      var attemptId = this.request.json.attemptId;
      if (attemptId && attemptId.length && attemptId.length <= 24) {
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
    
    this.Models.ExecutionAttempt.getSystemAttemptForModule(attempt.executionModuleId, function (systemAttempt) {
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
      var keys = ['registers', 'cf', 'pf', 'af', 'zf', 'sf', 'tf', 'if', 'df', 'of',
                  'memoryChangeAddresses', 'memoryChangeValues',
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