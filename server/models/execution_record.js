this.ExecutionRecord = {
  
  properties: [
    'attemptId',
    'count',
    'correct',
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
      computedFlags: [
        'cf',
        'pf',
        'af',
        'zf',
        'sf',
        'tf',
        'if',
        'df',
        'of'
      ]
    },
    {
      memory: [
        {
          changes: [['address', 'value']]
        },
        'checksum'
      ]
    }
  ],
  
  indexes: [
    { executionAttemptId: 1, count: 1, correct: 1 }
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    },
    
    normalize: function() {
      var instruction = this.instruction;
      instruction.mnemonic = String(instruction.mnemonic || "").trim().toUpperCase();
      instruction.addressingMode = String(instruction.addressingMode || "").trim().toUpperCase();
      
      var origOps = instruction.operands, normOps = [];
      for (var i = 0, len = origOps.length; i < len; ++i) {
        var op = origOps[i];
        normOps.push({
          type: op.type.trim().toUpperCase(),
          string: op.string.trim().toUpperCase()
        });
      }
      instruction.operands = normOps;
      
      var flagIndices = [
        ['cf', 0],
        ['pf', 2],
        ['af', 4],
        ['zf', 6],
        ['sf', 7],
        ['tf', 8],
        ['if', 9],
        ['df', 10],
        ['of', 11]
      ];
      
      console.log('initial flags: ' + Object.inspect(this.computedFlags));
      var flags = {};
      var flagsRegister = Number(this.registers.flags || 0);
      for (var i = 0, len = flagIndices.length; i < len; ++i) {
        var flagDescriptor = flagIndices[i];
        this.computedFlags[flagDescriptor[0]] = !!((flagsRegister >> flagDescriptor[1]) & 1);
        console.log('for flags value: ' + flagsRegister + ' and flag: ' + flagDescriptor[0] + ' at bit: ' + flagDescriptor[1] + ' got value: ' + !!((flagsRegister >> flagDescriptor[1]) & 1));
      }
      
      /*this.computedFlags = flags;
      for (var i = 0, len = flagIndices.length; i < len; ++i) {
        var flagDescriptor = flagIndices[i];
        console.log(flagDescriptor[0] + ' now set to: ' + this.flags[flagDescriptor[0]]);
      }*/
    },
    
    compareToReference: function(ref) {
      var incorrect = false;
      var errors = {
        registers: 0,
        flags: 0,
        memoryChangeAddresses: 0,
        memoryChangeValues: 0,
        operandTypes: 0,
        operandStrings: 0,
        instructionAddressingMode: 0,
        instructionSegment: 0,
        instructionOffset: 0,
        instructionMnemonic: 0,
        rawBytes: 0
      };
      
      // Compare instruction
      var instructionKeys = ['addressingMode', 'segment', 'offset', 'mnemonic'],
          instructionErrorKeys = ['instructionAddressingMode', 'instructionSegment', 'instructionOffset', 'instructionMnemonic'];
      for (var i = 0, len = instructionKeys.length; i < len; ++i) {
        var key = instructionKeys[i];
        if (this.instruction[key] != ref.instruction[key]) {
          incorrect = true;
          ++errors[instructionErrorKeys[i]];
        }
      }
      
      // Compare raw bytes
      var selfBytes = this.instruction.rawBytes, refBytes = ref.instruction.rawBytes,
          selfBytesLen = selfBytes.length, refBytesLen = refBytes.length;
      if (selfBytesLen != refBytesLen) {
        incorrect = true;
        errors.rawBytes += Math.abs(selfBytesLen, refBytesLen);
      }
      
      for (var i = 0, len = Math.min(selfBytesLen, refBytesLen); i < len; ++i) {
        if (selfBytes[i] != refBytes[i]) {
          incorrect = true;
          ++errors.rawBytes;
        }
      }
      
      // Compare operands
      var selfOps = this.instruction.operands, refOps = ref.instruction.operands,
          selfOpsLen = selfOps.length, refOpsLen = refOps.length;
      if (selfOpsLen != refOpsLen) {
        incorrect = true;
        var count = Math.abs(selfOpsLen - refOpsLen);
        errors.operandTypes += count;
        errors.operandStrings += count;
      }
      
      var checkOp = function(op, refOp) {
        if (op.type == refOp.type && op.string == refOp.string) {
          return [true, true];
        } else if (op.type == refOp.type) {
          // Only 'string' was incorrect
          return [true, false];
        } else if (op.string == refOp.string) {
          // Only 'type' was incorrect
          return [false, true];
        } else {
          // Completely incorrect
          return [false, false];
        }
      };
      
      var countOpErrors = function(correct) {
        if (!correct[0]) {
          incorrect = true;
          ++errors.operandTypes;
        }
        
        if (!correct[1]) {
          incorrect = true;
          ++errors.operandStrings;
        }
      };
      
      if (this.instruction.mnemonic == 'xchg') {
        // Special case, operand order doesn't matter
        var cmp0 = checkOp(selfOps[0], refOps[0])
        if (!cmp0[0] || !cmp[1]) {
          if (selfOpsLen > 1) {
            countOpErrors( checkOp(selfOps[0], refOps[1]) );
          } // else matched
        }
        
        if (selfOpsLen > 1) {
          var cmp1 = checkOp(selfOps[1], refOps[1]);
          if (!cmp1[0] || !cmp1[1]) {
            countOpErrors( checkOp(selfOps[1], refOps[0]) );
          } // else matched
        }
      } else {
        for (var i = 0, len = Math.min(selfOpsLen, refOpsLen); i < len; ++i) {
          countOpErrors( checkOp(selfOps[i], refOps[i]) );
        }
      }
      
      // Compare registers
      var registers = ['ax', 'bx', 'cx', 'dx', 'di', 'si', 'cs', 'ds', 'es', 'ss', 'bp', 'sp', 'ip'];
      for (var i = 0, len = registers.length; i < len; ++i) {
        var key = registers[i];
        if (this.registers[key] != ref.registers[key]) {
          incorrect = true;
          ++errors.registers;
        }
      }
      
      // Compare flags separately since non-essential bits are undefined
      if (this.registers.flags != ref.registers.flags) {
        incorrect = true;
        ++errors.flags;
      }
      
      
      // Compare memory
      var selfMemChgs = this.memory.changes, refMemChgs = ref.memory.changes,
          selfMemChgsLen = selfMemChgs.length, refMemChgsLen = refMemChgs.length;
      if (selfMemChgsLen != refMemChgsLen) {
        incorrect = true;
        errors.memoryChanges += Math.abs(selfMemChgsLen, refMemChgsLen);
      }
      
      for (var i = 0; i < refMemChgsLen; ++i) {
        var chg = refMemChgs[i], addrCorrect = false, valCorrect = false;
        for (var h = 0; h < selfMemChgsLen; ++h) {
          if (selfMemChgs[h].address == chg.address) {
            addrCorrect = true;
            if (selfMemChgs[h].value == chg.value) {
              valCorrect = true;
              break;
            }
          }
        }
        
        if (!addrCorrect) { ++errors.memoryChangeAddresses; }
        if (!valCorrect) { ++errors.memoryChangeValues; }
      }
      
      return [incorrect, errors];
    }
  },
  
  static: {
    
  }
  
};