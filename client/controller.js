//= require "core"

Sim.UI.Controller = Class.create({
  
  initialize: function(container) {
    this.container = container;
    this.render();
    this.bind();
  },
  
  bind: function() {
    
  },
  
  destroy: function() {
    this.element.remove();
  },
  
  grab: function(selector) {
    return this.element.select(selector).first();
  },
  
  render: function() {
    this.element = new Element(this.tag, this.attributes);
    
    // Render template
    var templatePath = this.getTemplatePath()
    if (templatePath) {
      this.template = new EJS({text: Sim.UI.Templates[templatePath] });
    } else {
      this.template = new EJS({text: ""});
    }
    
    // Update element
    var html = this.template.render(this);
    this.element.update(html);
    
    // Insert into container
    this.container.insert({bottom: this.element});
  },
  
  getTemplatePath: function() {
    return null;
  },
  
  tag: 'div',
  attributes: {}
  
});