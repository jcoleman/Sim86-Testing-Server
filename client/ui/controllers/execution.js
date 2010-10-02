//= require "../../controller"

Sim.UI.Execution = {};

Sim.UI.Execution.DisplayController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, options) {
    this.instructionKeys = ['addressingMode', 'mnemonic', 'segment', 'offset'];
    
    this.flagNames = ['cf', 'pf', 'af', 'zf', 'sf', 'tf', 'if', 'df', 'of'];
    this.registerNames = ['ax', 'bx', 'cx', 'dx', 'di', 'si', 'cs', 'ds', 'es', 'ss', 'ip', 'sp'];
    
    $super(container);
  },
  
  bind: function($super) {
    $super();
    
    this.cacheDisplayElements();
  },
  
  update: function(record, reference) {
    var self = this;
    
    this.statusElement.update(reference ? '' : 'No reference record found.');
    
    this.updateReference(reference || this.emptyRecord);
    
    this.updateRecordDisplay(record, reference || this.emptyRecord);
  },
  
  updateReference: function(reference) {
    var elements = this.referenceElements;
    
    this.registerNames.each(function (register, index) {
      elements.registerElements[index].update(reference.registers[register]);
    });
    
    this.instructionKeys.each(function (key) {
      elements.instructionElements[key].update(reference.instruction[key]);
    });
    
    this.flagNames.each(function (key) {
      elements.flagElements[key].update(reference.computedFlags[key] ? 'ON' : 'OFF');
    });
    
    elements.memoryChangesElement.update(
      "<ul>" + reference.memory.changes.inject("", function (html, change) {
        return html + "<li><span>Address:</span> " + change.address + "<br/><span>Value:</span> " + change.value + "</li>";
      }) + "</ul>"
    );
  },
  
  updateRecordDisplay: function(record, reference) {
    var elements = this.recordElements;
    
    this.countElement.update(record.count);
    
    this.registerNames.each(function (register, index) {
      var newValue = record.registers[register];
      var element = elements.registerElements[index];
      element.update(newValue);
      
      if (newValue != reference.registers[register]) {
        element.addClassName('record-incorrect');
      } else {
        element.removeClassName('record-incorrect');
      }
    });
    
    this.instructionKeys.each(function (key) {
      var newValue = record.instruction[key];
      var element = elements.instructionElements[key];
      element.update(newValue);
      
      if (newValue != reference.instruction[key]) {
        element.addClassName('record-incorrect');
      } else {
        element.removeClassName('record-incorrect');
      }
    });
    
    this.flagNames.each(function (key) {
      var newValue = record.computedFlags[key];
      var element = elements.flagElements[key];
      element.update(newValue ? 'ON' : 'OFF');
      
      if (newValue != reference.computedFlags[key]) {
        element.addClassName('record-incorrect');
      } else {
        element.removeClassName('record-incorrect');
      }
    });
    
    elements.memoryChangesElement.update(
      "<ul>" + record.memory.changes.inject("", function (html, change) {
        return html + "<li><span>Address:</span> " + change.address + "<br/><span>Value:</span> " + change.value + "</li>";
      }) + "</ul>"
    );
  },
  
  cacheDisplayElements: function() {
    var self = this;
    
    this.countElement = self.grab('.record-count');
    this.statusElement = self.grab('.record-status');
    
    this.recordElements = {};
    this.referenceElements = {};
    
    ['record', 'reference'].each(function (type) {
      var elements = self[type + 'Elements'];
      elements.registerElements = self.registerNames.collect(function (register) {
        return self.grab('.' + type + '-register-' + register);
      });

      elements.instructionElements = {};
      self.instructionKeys.each(function (key) {
        elements.instructionElements[key] = self.grab('.' + type + '-instruction-' + key);
      });
      
      elements.flagElements = {};
      self.flagNames.each(function (key) {
        elements.flagElements[key] = self.grab('.' + type + '-flag-' + key);
      });
      
      elements.memoryChangesElement = self.grab('.' + type + '-memory-changes');
    });
  },
  
  emptyRecord: {
    instruction: {
      addressingMode: "",
      mnemonic: "",
      offset: 0,
      operands: [],
      rawBtes: [],
      segment: 0
    },
    memory: {
      checksum: 0,
      changes: []
    },
    registers: {
      ax: 0,
      bx: 0,
      cx: 0,
      dx: 0,
      es: 0,
      cs: 0,
      ds: 0,
      ss: 0,
      si: 0,
      di: 0,
      bp: 0,
      sp: 0,
      ip: 0,
      flags: 0
    },
    computedFlags: {
      cf: false,
      pf: false,
      af: false,
      zf: false,
      sf: false,
      tf: false,
      'if': false,
      df: false,
      of: false
    }
  },
  
  getTemplatePath: function() {
    return 'execution_display';
  }
  
});