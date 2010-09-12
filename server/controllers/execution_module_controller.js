this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  'new': function() {
    var self = this;
    if (this.request.method == "POST") {
      // Create new executionModule
      var filename = (this.request.post.filename || "").toLowerCase();
      this.Models.ExecutionModule.find({filename: filename}).one(function (existingExecutionModule) {
        var renderExecutionModule = function(executionModule) {
          self.render({template: 'executionModule/show', locals: {executionModule: executionModule}});
          self.resume();
        };
        if (existingExecutionModule) {
          renderExecutionModule(existingExecutionModule);
        } else {
          var newExecutionModule = new self.Models.ExecutionModule(self.request.post);
          newExecutionModule.token = self.SHA1.sha1Hash(filename + Math.random());
          newExecutionModule.save(function() {
            renderExecutionModule(newExecutionModule);
          });
        }
      });
    } else if (this.request.method == "GET") {
      // Render the create executionModule template
      this.render({template: 'executionModule/new'});
      this.resume();
    } else {
      this.renderError({errorCode: this.NOT_FOUND});
      this.resume();
    }
  },
  
  show: function() {
    
  }
  
};