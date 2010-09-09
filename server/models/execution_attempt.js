this.ExecutionAttempt = {
  
  properties: [
    'userId',
    'executionModuleId',
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