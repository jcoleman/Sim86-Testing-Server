this.ProjectPhase = {
  properties: [
    'name',
    'dueDate',
    {
      executionModules: [
        [
          'executionModuleId',
          'filename'
        ]
      ]
    }
  ],
  
  indexes: [
    { name: 1, dueDate: 1 }
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    }
  },
  
  static: {
    
  }
  
};