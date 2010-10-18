//= require "base"
  
Sim.UI.Admin.PhaseManagementController = Class.create(Sim.UI.Controller, {
  
  bind: function($super) {
    var self = this;
    $super();
    
    Sim.Messenger.receive(this, 'reload.phaseManagement', function (message) {
      self.setupPhaseManagement();
    });
    
    this.setupPhaseManagement();
  },
  
  setupPhaseManagement: function() {
    var self = this;
    
    if (this.phaseListController) { this.phaseListController.destroy(); }
    if (this.currentPhaseEditor) { this.currentPhaseEditor.destroy(); }
    
    this.phaseListController = new Sim.UI.ListController(
      this.grab('.phase-list-container'),
      {
        listParent: this.grab('.phase-list'),
        retrieveItems: function(callback) {
          Sim.Messenger.sendRemote('retrieve.phases', {}, function(message) {
            callback(Object.isArray(message.object) ? message.object : []);
          });
        },
        itemTemplate: "admin_phase_list_item",
        onItemRender: function (element, item) {
          element.select('.phase-link').first().observe('click', function(event) {
            if (self.currentPhaseEditor) {
              self.currentPhaseEditor.destroy();
            }
            
            self.currentPhaseEditor = new Sim.UI.Admin.PhaseEditorController(self.grab('.phase-editor'), item);
            event.stop();
          });
          
          element.select('.remove-link').first().observe('click', function(event) {
            if (self.currentPhaseEditor) {
              self.currentPhaseEditor.destroy();
            }
            
            Sim.Messenger.sendRemote('delete.phase', {phaseId: item._id}, function(message) {
              if (message.success) {
                self.phaseListController.removeItem(item);
              } else {
                alert('Unable to delete phase: ' + message.object.error);
              }
            });
            
            event.stop();
          });
        }
      }
    );
    
    this.grab('.add-new-phase-link').observe('click', function(event) {
      if (self.currentPhaseEditor) {
        self.currentPhaseEditor.destroy();
      }
      
      self.currentPhaseEditor = new Sim.UI.Admin.PhaseEditorController(self.grab('.phase-editor'));
      
      event.stop();
    });
    
  },
  
  getTemplatePath: function() {
    return 'admin_phase_management';
  }
  
});