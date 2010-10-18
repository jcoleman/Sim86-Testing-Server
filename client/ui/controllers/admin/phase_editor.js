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
        self.phase.dueDate = val ? new Date(val) : null;
        dueDateInput.setValue(new Date(val));
      } catch (e) {
        alert("Unable to parse due date");
        self.phase.dueDate = null;
        dueDateInput.setValue(null);
      }
    });
    
    this.grab('.save-link').observe('click', function(event) {
      var newObject = !self.phase._id;
      Sim.Messenger.sendRemote('createOrUpdate.phase', self.phase, function(message) {
        if (newObject) {
          Sim.Messenger.sendLocal('reload.phaseManagement', {});
        }
      });
    });
  },
  
  getTemplatePath: function() {
    return 'admin_phase_editor';
  }
  
});