//= require "../application"
//= require "phase_management"
//= require "student_submission"
//= require "student_attempts"
//= require "base"

Sim.UI.Admin.ApplicationController = Class.create(Sim.UI.ApplicationController, {
  
  onLoginSuccess: function() {
    var self = this;
    /*
    this.listParent = options.listParent;
    this.retrieveItems = options.retrieveItems;
    this.itemTemplate = options.itemTemplate;
    this.onItemRender = options.onItemRender;
    this.onItemRemove = options.onItemRemove;
    */
    this.adminMenuController = new Sim.UI.ListController(
      this.grab('.admin-menu-container'),
      {
        listParent: this.grab('.admin-menu'),
        retrieveItems: function(callback) { callback(Object.keys(self.adminOptions)); },
        itemTemplate: "admin_admin_list_item",
        onItemRender: function (element, item) {
          element.select('.admin-link').first().observe('click', function(event) {
            if (self.currentAdminPane) {
              self.currentAdminPane.destroy();
            }
            
            var adminPaneKlass = self.adminOptions[item];
            if (adminPaneKlass) {
              self.currentAdminPane = new adminPaneKlass(self.grab('.admin-editor'));
            } else {
              self.currentAdminPane = null;
            }
            
            event.stop();
          });
        }
      }
    );
    
    
    
  },
  
  adminOptions: {
    "Phase Management": Sim.UI.Admin.PhaseManagementController,
    "Student Phase Submissions": Sim.UI.Admin.StudentSubmissionViewController,
    "Modules Attempted by Student": Sim.UI.Admin.StudentAttemptsViewController,
    "System": null
  },
  
  getTemplatePath: function() {
    return 'admin_admin';
  }
  
});