this.ExecutionRecord = {
  
  properties: [
    'user',
    'module',
    'count',
    {
      instruction: [
        'addressingMode',
        'address',
        'mnemonic',
        'operands',
        'raw'
      ]
    },
    {
      registers: []
    },
    {
      memory: [
        {
          changed: []
        },
        'checksum'
      ]
    }
  ],
  
  indexes: [
    { user: 1, module: 1, count: 1 }
  ],
  
  methods: {
    
  },
  
  static: {
    
  }
  
};