this.User = {
  
  properties: [
    'username',
    'token'
  ],
  
  indexes: [
    [{'username': 1}, {unique: true}]
  ],
  
  methods: {
    id: function() {
      return this._id.toHexString();
    }
  },
  
  static: {
    
  }
  
};