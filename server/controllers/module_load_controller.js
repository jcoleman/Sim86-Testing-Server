this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  defaultContentType: "JSON",
  
  beforeFilter: function() {
    var self = this;
    this.Models.User.find({token: this.request.json.token}).one(function (user) {
      if (user) {
        self.currentUser = user;
        
        var filename = (self.request.json.filename || "").toLowerCase();
        self.Models.ExecutionModule.find({filename: filename}).one(function (module) {
          if (module) {
            self.module = module;
            self.resume();
          } else {
            self.sendModuleNotFound(true);
          }
        });
      } else {
        self.sendAuthenticationFailure(true);
      }
    });
    
  },
  
  'new': function() {
    var self = this;
    
    self.Models.LoadedModule.find({executionModuleId: this.module.id()}).one(function (loadedModule) {
      if (loadedModule) {
        var json = self.request.json;
        var exception = null;
        var memoryErrorCount = 0;
        var incorrectRegisters = [];
        
        try {
          // Compare registers
          var registers = ['ax', 'bx', 'cx', 'dx', 'di', 'si', 'cs', 'ds', 'es', 'ss', 'bp', 'sp', 'ip'];
          for (var i = 0, len = registers.length; i < len; ++i) {
            var key = registers[i];
            if (json.registers[key] != loadedModule.registers[key]) {
              incorrectRegisters.push(key);
            }
          }
          
          // Compare memory
          var bytes = json.memoryBytes, refBytes = loadedModule.memoryBytes,
              bytesLen = bytes.length, refBytesLen = refBytes.length;
          if (bytesLen != refBytesLen) {
            memoryErrorCount += Math.abs(bytesLen - refBytesLen);
          }

          for (var i = 0, len = Math.min(bytesLen, refBytesLen); i < len; ++i) {
            if (bytes[i] != refBytes[i]) {
              ++memoryErrorCount;
            }
          }
        } catch (e) {
          exception = true;
        }
        
        if (exception) {
          self.render({ json: {status: "INVALID_DATA"} });
          self.resume();
        } else {
          var correct = memoryErrorCount == 0 && incorrectRegisters.length == 0;
          var loadAttempt = new self.Models.ModuleLoadAttempt({
            createdAt: new Date(),
            userId: self.currentUser.id(),
            executionModuleId: self.module.id(),
            filename: self.module.filename,
            memoryErrorCount: memoryErrorCount,
            incorrectRegisters: incorrectRegisters,
            correct: correct
          });
          loadAttempt.save(function() {
            self.render({ json: {
              loadAttemptId: loadAttempt.id(),
              status: "SUCCESS",
              correct: correct,
              memoryErrorCount: memoryErrorCount,
              incorrectRegisters: incorrectRegisters
            } });
            self.resume();
          });
        }
      } else {
        self.render({ json: {status: "NO_REFERENCE_AVAILABLE_FOR_MODULE"} });
        self.resume();
      }
    });
  },
  
  load: function() {
    var self = this;
    
    if (this.currentUser.id() == this.Models.User.system.id()) {
      var loadedModule = new this.Models.LoadedModule(this.request.json);
      loadedModule.userId = this.currentUser.id();
      loadedModule.createdAt = new Date();
      loadedModule.executionModuleId = this.module.id();
      loadedModule.save(function() {
        self.render({ json: {status: "SUCCESS"} })
        self.resume();
      });
    } else {
      self.render({ json: {status: "AUTHORIZATION_FAILURE"} });
      self.resume();
    }
  },
  
  sendModuleNotFound: function(finalize) {
    this.render({ json: {status: "INVALID_MODULE_FILENAME"} });
    if (finalize) {
      this.haltFilterChain();
    } else {
      this.resume();
    }
  },
  
  sendAuthenticationFailure: function(finalize) {
    this.render({ json: {status: "AUTHENTICATION_FAILURE"} });
    if (finalize) {
      this.haltFilterChain();
    } else {
      this.resume();
    }
  }
  
};