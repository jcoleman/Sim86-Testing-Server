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

/*
Mongoose.model('User', require('./user').User);
this.User = DB.model('User');

Mongoose.model('ExecutionAttempt', require('./execution_attempt').ExecutionAttempt);
this.ExecutionAttempt = DB.model('ExecutionAttempt');

Mongoose.model('ExecutionModule', require('./execution_module').ExecutionModule);
this.ExecutionModule = DB.model('ExecutionModule');

Mongoose.model('ExecutionRecord', require('./execution_record').ExecutionRecord);
this.ExecutionRecord = DB.model('ExecutionRecord');
*/