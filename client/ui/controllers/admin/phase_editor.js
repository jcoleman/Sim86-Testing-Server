//= require "base"

Sim.UI.Admin.PhaseEditorController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, phase) {
    this.phase = phase || {name: '', dueDate: null, executionModules: []};
    
    $super(container);
  },
  
  bind: function($super) {
    var self = this;
    $super();
    
    var nameInput = this.grab('#phase_name_field');
    nameInput.observe('blur', function() {
      self.phase.name = nameInput.getValue();
    });
    
    var dueDateInput = this.grab('#phase_dueDate_field');
    dueDateInput.observe('blur', function() {
      try {
        var val = dueDateInput.getValue();
        var date = Date.parse(val);
        self.phase.dueDate = val ? date : null;
        dueDateInput.setValue(date.toString("h:mm M/d/yyyy"));
      } catch (e) {
        alert("Unable to parse due date");
        self.phase.dueDate = null;
        dueDateInput.setValue(null);
      }
    });
    
    this.setupModuleListEditing();
    
    this.grab('.save-link').observe('click', function(event) {
      var newObject = !self.phase._id;
      Sim.Messenger.sendRemote('createOrUpdate.phase', self.phase, function(message) {
        if (newObject) {
          Sim.Messenger.sendLocal('reload.phaseManagement', {});
        }
      });
    });
  },
  
  setupModuleListEditing: function() {
    var self = this;
    if (!self.phase.executionModules) { self.phase.executionModules = []; }
    
    this.unusedModuleListController = new Sim.UI.ListController(
      this.grab('.phase-module-list-container'),
      {
        listParent: this.grab('.unused-module-list'),
        retrieveItems: function(callback) {
          Sim.Messenger.sendRemote('retrieve.modules', {}, function(message) {
            var items = (Object.isArray(message.object) ? message.object : []).collect(function (module) {
              return {
                executionModuleId: module._id,
                filename: module.filename
              };
            }).findAll(function (item) {
              return !self.phase.executionModules.find(function(phaseModule) {
                return phaseModule.executionModuleId == item.executionModuleId;
              });
            });
            callback(items);
          });
        },
        itemTemplate: "admin_unused_module_list_item",
        onItemRender: function (element, item) {
          element.select('.module-link').first().observe('click', function(event) {
            self.phase.executionModules.push(item);
            self.unusedModuleListController.removeItem(item);
            self.usedModuleListController.addItem(item);
            
            event.stop();
          });
        }
      }
    );
    
    this.usedModuleListController = new Sim.UI.ListController(
      this.grab('.phase-module-list-container'),
      {
        listParent: this.grab('.used-module-list'),
        retrieveItems: function(callback) {
          callback(self.phase.executionModules);
        },
        itemTemplate: "admin_used_module_list_item",
        onItemRender: function (element, item) {
          element.select('.module-link').first().observe('click', function(event) {
            self.phase.executionModules = self.phase.executionModules.without(item);
            self.usedModuleListController.removeItem(item);
            self.unusedModuleListController.addItem(item);
            
            event.stop();
          });
        }
      }
    );
  },
  
  getTemplatePath: function() {
    return 'admin_phase_editor';
  },
  
  destroy: function($super) {
    var self = this;
    ['unusedModuleListController', 'usedModuleListController'].each(function(prop) {
      if (self[prop]) {
        self[prop].destroy();
        delete self[prop];
      }
    });
    $super();
  }
  
});