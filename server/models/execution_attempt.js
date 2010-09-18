this.ExecutionAttempt = {
  
  properties: [
    'userId',
    'createdAt',
    'executionModuleId',
    'filename',
    'completed',
    'createdAt',
    'recordCount',
    'correctCount',
    'incorrectCount'
  ],
  
  indexes: [
    { user: 1, executionModuleId: 1 }
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    }
  },
  
  static: {
    
  }
  
};