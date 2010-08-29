this.ExecutionRecord = {
  
  properties: [
    'attemptId',
    'count',
    {
      instruction: [
        'addressingMode',
        'segment',
        'offset',
        'mnemonic',
        {
          operands: [
            ['type', 'string']
          ]
        },
        {
          rawBytes: []
        }
      ]
    },
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
      memory: [
        {
          changed: [['address', 'value']]
        },
        'checksum'
      ]
    }
  ],
  
  indexes: [
    { executionAttemptId: 1, count: 1 }
  ],
  
  methods: {
    
  },
  
  static: {
    
  }
  
};