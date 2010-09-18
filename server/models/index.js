var Mongoose = require('../../vendor/mongoose/mongoose').Mongoose;
var DB = Mongoose.connect('mongodb://localhost/db');

this.Mongoose = Mongoose;
this.DB = DB;

var self = this;
['User', 'ExecutionAttempt', 'ExecutionModule', 'ExecutionRecord'].each(function(module) {
  console.log("Loading: " + module);
  Mongoose.model(module, require('./' + module.underscore())[module]);
  self[module] = DB.model(module);
});

this.User.find({username: 'system'}).one(function(user) {
  self.User.system = user;
});

this.User.__systemModuleAttempts = {};
this.User.getSystemAttemptForModule = function(moduleId, callback) {
  var attempt = self.User.__systemModuleAttempts[moduleId];
  if (attempt) {
    callback(attempt);
  } else {
    self.ExecutionAttempt.find({
      userId: self.User.system.id(),
      executionModuleId: moduleId
    }).last(function(attempt) {
      if (attempt) {
        self.User.__systemModuleAttempts[attempt.id()] = attempt;
      }
      
      callback(attempt);
    });
  }
};