//= require "base"

Sim.UI.Admin.StudentSubmissionViewController = Class.create(Sim.UI.Controller, {
  
  initialize: function($super, container, phase) {
    this.phase = phase;
    
    $super(container);
  },
  
  bind: function($super) {
    var self = this;
    $super();
    
    this.phaseListController = new Sim.UI.ListController(
      this.grab('.phase-list-container'),
      {
        listParent: this.grab('.phase-list'),
        retrieveItems: function(callback) {
          Sim.Messenger.sendRemote('retrieve.phases', {}, function(message) {
            callback(Object.isArray(message.object) ? message.object : []);
          });
        },
        itemTemplate: "admin_submission_phase_list_item",
        onItemRender: function (element, item) {
          element.select('.phase-link').first().observe('click', function(event) {
            self.retrievePhaseSubmissionAttemptInformation(item, function(phaseSubmissionDescriptor) {
              // Render template
              var template = new EJS({text: Sim.UI.Templates.admin_student_phase_results_viewer});
              var html = template.render({phaseSubmissionDescriptor: phaseSubmissionDescriptor, phase: item});
              self.grab('.phase-viewer').update(html);
            });
            
            event.stop();
          });
        }
      }
    );
  },
  
  retrievePhaseSubmissionAttemptInformation: function(phase, callback) {
    var self = this;
    Sim.Messenger.sendRemote('retrieve.attempts.admin.byPhaseSubmission', {phaseId: phase._id}, function(message) {
      /* returns:
      {
        systemAttempts: systemAttempts,
        usersAttempts: usersAttempts,
        users: users
      }
      */
      if (message.success) {
        callback(message.object);
      } else {
        alert("Error while retrieveing student submission information: " + message.object.error);
      }
    });
  },
  
  getTemplatePath: function() {
    return 'admin_student_submission';
  }
  
});