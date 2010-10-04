this.LoadedModule = {
  properties: [
    'userId',
    'createdAt',
    'executionModuleId',
    'filename',
    'createdAt',
    {
      registers: [
        'ax',
        'bx',
        'cx',
        'dx',
        'di',
        'si',
        'cs',
        'ds',
        'es',
        'ss',
        'bp',
        'sp',
        'ip',
        'flags'
      ]
    },
    {
      memoryBytes: []
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