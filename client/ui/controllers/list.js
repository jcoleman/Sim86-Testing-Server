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
    
    this.itemElementHash = {};
    
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
    
    console.log("inserting", el, "into", this.listParent);
    
    this.listParent.insert({bottom: el});
    this.itemElementHash[item] = el;
    
    if (this.onItemRender) {
      this.onItemRender(el, item);
    }
  },
  
  removeItem: function(item) {
    if (this.onItemRemove) {
      this.onItemRemove(item)
    }
    
    var el = this.itemElementHash[item];
    if (el) {
      el.remove();
    }
  },
  
  getTemplatePath: function() {
    return null;
  },
  
  destroy: function($super) {
    var self = this;
    Object.keys(this.itemElementHash).each(function(item) {
      self.removeItem(item);
    });
    
    this.itemElementHash = {};
    
    $super();
  }
  
});