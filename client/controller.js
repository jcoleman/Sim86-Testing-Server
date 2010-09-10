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
    this.element = this.renderTemplateIntoElement({ template: this.getTemplatePath(), 
                                                    tag: this.tag,
                                                    attributes: this.attributes });
    
    // Insert into container
    this.container.insert({bottom: this.element});
  },
  
  renderTemplateIntoElement: function(options) {
    // Create element
    var element = new Element(options.tag || 'div', options.attributes || {});
    
    // Render template
    var template;
    if (options.template) {
      template = new EJS({text: Sim.UI.Templates[options.template] });
    } else {
      template = new EJS({text: ""});
    }
    
    // Update element
    console.log('rendering with locals:', options.locals || this);
    var locals = Object.extend({}, options.locals || this);
    var html = template.render(locals);
    element.update(html);
    
    return element;
  },
  
  getTemplatePath: function() {
    return null;
  },
  
  tag: 'div',
  attributes: {}
  
});