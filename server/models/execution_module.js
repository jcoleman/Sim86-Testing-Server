this.ExecutionModule = {
  
  properties: [
    'filename'
  ],
  
  indexes: [
    'filename'
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    }
  },
  
  static: {
    
  }
  
};