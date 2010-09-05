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
    
  },
  
  static: {
    
  }
  
};