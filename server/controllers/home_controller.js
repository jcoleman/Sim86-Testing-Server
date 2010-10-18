this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  index: function() {
    this.render({template: "home/index"});
    this.resume();
  },
  
  admin: function() {
    this.render({template: "home/admin"});
    this.resume();
  }
  
}