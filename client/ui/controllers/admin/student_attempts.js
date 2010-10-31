//= require "base"

Sim.UI.Admin.StudentAttemptsViewController = Class.create(Sim.UI.Controller, {
  
  bind: function($super) {
    var self = this;
    $super();
    
    this.phaseListController = new Sim.UI.ListController(
      this.grab('.attempts-list-container'),
      {
        listParent: this.grab('.attempts-list'),
        retrieveItems: function(callback) {
          self.retrieveStudentAttemptInformation(callback);
        },
        itemTemplate: "admin_student_attempts_list_item",
        onItemRender: function (element, item) {
          
        }
      }
    );
  },
  
  retrieveStudentAttemptInformation: function(callback) {
    var self = this;
    Sim.Messenger.sendRemote('retrieve.attempts.admin.byStudent', {}, function(message) {
      /* returns:
      {
        usersAttempts: usersAttempts,
        users: users
      }
      */
      if (message.success) {
        var items = [];
        Object.keys(message.object.usersAttempts).each(function(userId) {
          items.push({
            user: message.object.users[userId],
            attempts: message.object.usersAttempts[userId]
          });
        });
        
        callback(items);
      } else {
        alert("Error while retrieveing student attempt information: " + message.object.error);
      }
    });
  },
  
  getTemplatePath: function() {
    return 'admin_student_attempts';
  }
  
});