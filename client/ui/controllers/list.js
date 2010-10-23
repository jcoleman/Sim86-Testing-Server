//=require "../../controller"

Sim.UI.ListController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    this.listParent = options.listParent;
    this.retrieveItems = options.retrieveItems;
    this.itemTemplate = options.itemTemplate;
    this.onItemRender = options.onItemRender;
    this.onItemRemove = options.onItemRemove;
    
    $super(container);
  },
  
  bind: function($super) {
    $super();
    
    var self = this;
    
    this.itemElements = [];
    
    this.retrieveItems(function(items) {
      console.log("retrieve items returned", items);
      items.each(function(item) {
        self.addItem(item);
      });
    });
  },
  
  addItem: function(item) {
    var el = this.renderTemplateIntoElement({
      template: this.itemTemplate,
      tag: 'li',
      locals: {item: item}
    });
    
    this.listParent.insert({bottom: el});
    this.itemElements.push({item: item, el: el});
    
    if (this.onItemRender) {
      this.onItemRender(el, item);
    }
  },
  
  removeItem: function(item) {
    if (this.onItemRemove) {
      this.onItemRemove(item)
    }
    
    var desc = this.itemElements.find(function(it) { return it.item === item; });
    if (desc) {
      desc.el.remove();
      this.itemElements = this.itemElements.without(desc);
    }
  },
  
  getTemplatePath: function() {
    return null;
  },
  
  destroy: function($super) {
    var self = this;
    this.itemElements.each(function(desc) {
      self.removeItem(desc.item);
    });
    
    this.itemElements = [];
    
    $super();
  }
  
});