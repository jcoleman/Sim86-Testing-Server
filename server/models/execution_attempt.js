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
    'incorrectCount',
    {
      errorsByType: [
        'registers',
        'flags',
        'memoryChangeAddresses',
        'memoryChangeValues',
        'operandTypes',
        'operandStrings',
        'instructionAddressingMode',
        'instructionSegment',
        'instructionOffset',
        'instructionMnemonic',
        'rawBytes'
      ]
    }
  ],
  
  indexes: [
    { user: 1, executionModuleId: 1 }
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    },
    
    initializeValues: function() {
      this.createdAt = new Date();
      
      this.correctCount = 0;
      this.recordCount = 0;
      this.incorrectCount = 0;
      
      var keys = ['registers', 'flags', 'memoryChangeAddresses', 'memoryChangeValues',
                  'operandTypes', 'operandStrings', 'instruction', 'rawBytes'];
      for (var i = 0, len = keys.length; i < len; ++i) {
        this.errorsByType[keys[i]] = 0;
      }
    }
  },
  
  static: {
    
  }
  
};