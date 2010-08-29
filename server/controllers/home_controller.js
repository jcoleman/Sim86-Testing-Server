this.base = 'ApplicationController';

this.extensions = [];

this.klass = {
  
  index: function() {
    this.render({text: "<html><head><title>HOME</title></head><body><h2>Test Page</h2></body></html>"});
    this.resume();
  }
  
}