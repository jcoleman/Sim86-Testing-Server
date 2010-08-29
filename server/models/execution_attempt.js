this.ExecutionAttempt = {
  
  properties: [
    'user',
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