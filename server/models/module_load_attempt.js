this.ModuleLoadAttempt = {
  properties: [
    'userId',
    'createdAt',
    'executionModuleId',
    'filename',
    'createdAt',
    'correct',
    'memoryErrorCount',
    {
      incorrectRegisters: []
    }
  ],
  
  indexes: [
    { userId: 1, executionModuleId: 1 }
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    }
  },
  
  static: {
    
  }
  
};