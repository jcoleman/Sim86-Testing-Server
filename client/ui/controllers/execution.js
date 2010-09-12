//= require "../../controller"

Sim.UI.Execution = {};

Sim.UI.Execution.DisplayController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    this.instructionKeys = ['addressingMode', 'mnemonic', 'segment', 'offset'];
    
    this.registerNames = ['ax', 'bx', 'cx', 'dx', 'di', 'si', 'cs', 'ds', 'es', 'ss', 'ip', 'sp'];
    
    $super(container);
  },
  
  bind: function($super) {
    $super();
    
    this.cacheDisplayElements();
  },
  
  update: function(record) {
    var self = this;
    
    if (!record) {
      this.statusElement.update('No reference record found.');
      return;
    }
    
    this.registerNames.each(function (register, index) {
      self.registerElements[index].update(record.registers[register]);
    });
    
    this.countElement.update(record.count);
    
    this.instructionKeys.each(function (key) {
      self.instructionElements[key].update(record.instruction[key]);
    });
  },
  
  cacheDisplayElements: function() {
    var self = this;
    
    this.statusElement = self.grab('.record-status');
    
    this.registerElements = this.registerNames.collect(function (register) {
      return self.grab('.record-register-' + register);
    });
    
    this.countElement = this.grab('.record-count');
    
    this.instructionElements = {};
    this.instructionKeys.each(function (key) {
      self.instructionElements[key] = self.grab('.record-instruction-' + key);
    });
  },
  
  getTemplatePath: function() {
    return 'execution_display';
  }
  
});