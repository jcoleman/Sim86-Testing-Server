var compiledTemplates = {};

this.base = null;

this.extensions = [];

this.klass = {
  
  initialize: function(options, routeOptions) {
    console.log("Instantiating controller");
    
    this.request = options.request;
    this.response = options.response;
    this.options = options;
    
    if (routeOptions) {
      if (routeOptions.parseJSON) {
        this.request.json = JSON.parse(this.request.completeBody);
      } else if (routeOptions.parsePOST) {
        this.request.post = this.QueryString.parse(this.request.completeBody);
      }
    }
  },
  
  beforeFilter: function(action) {
    console.log("beforeFilter()");
    this.resume();
  },
  
  afterFilter: function(action) {
    console.log("afterFilter()");
    this.resume();
  },
  
  finalize: function() {
    console.log("finalize()");
    this.finalized = true;
    this.response.end();
  },
  
  defaultContentType: "HTML",
  
  render: function(options) {
    if (this.rendered) { throw new Error("Cannot render more than once."); }
    this.rendered = true;
    
    console.log("render()");
    
    if (!options.status) { options.status = this.SUCCESS; }
    options.contentType = options.contentType || this.defaultContentType;
    
    this.response.writeHead(options.status, {'Content-Type': this.CONTENT_TYPES[options.contentType]});
    if (options.text !== undefined) {
      this.response.write(options.text);
    } else if (options.json !== undefined) {
      this.response.write(Object.toJSON(options.json));
    } else if (options.template !== undefined) {
      //var renderer = this.loadTemplateRenderFunction(options.template);
      console.log(this.FS.realpathSync('./'));
      var templateFile = './templates/' + options.template + '.ejs';
      var content = this.EJS.render(this.loadTemplateFile(templateFile), {context: this, locals: (options.locals || {})});
      this.response.write(content);
    }
  },
  
  loadTemplateFile: function(path) {
    return this.FS.readFileSync(path, 'utf8');
  },
  
  /*
  compiledTemplateCache: {},
  
  loadTemplateRenderFunction: function(path) {
    var cached = this.compiledTemplateCache[path]
    if (cached) {
      return cached;
    } else {
      var data = this.FS.readFileSync(path, 'utf8');
      var template = this.EJS.compile(data);
      
      if (ENVIRONMENT_CONFIG.templating.cacheOnCompile) {
        this.compiledTemplatesCache[path] = template
      }
      
      return template;
    }
  },
  */
  
  renderError: function(options) {
    if (!options.errorCode) { options.errorCode = this.SERVER_ERROR; }
    
    options.contentType = options.contentType || this.defaultContentType;
    this.render( { contentType: options.contentType,
                   status: options.errorCode,
                   text: this.DEFAULT_RESPONSES[options.contentType][options.errorCode] } );
  },
  
  dispatch: function(action) {
    if (this[action]) {
      this.executeFilterChain(action);
    } else {
      this.renderError({errorCode: this.NOT_FOUND});
      this.finalize();
    }
  },
  
  executeFilterChain: function(action) {
    this.rendered = false;
    this.finalized = false;
    
    var self = this;
    var filterChain = [this.finalize, this.afterFilter, this[action], this.beforeFilter];
    
    this.addToFilterChain = function(fn) {
      filterChain.push(fn);
    }
    
    this.haltFilterChain = function() {
      filterChain.clear();
      self.finalize();
    }
    
    this.resume = function() {
      if (self.finalized) {
        throw new Error("Cannot resume a finalized filter chain.");
      }
      
      setTimeout(filterChain.pop().bind(self), 0);
    }
    
    this.resume();
  },
  
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  SUCCESS: 200,
  
  CONTENT_TYPES: {
    HTML: 'text/html',
    JSON: 'application/json'
  },
  
  DEFAULT_RESPONSES: {
    JSON: {
      200: "{}",
      404: "{}",
      500: "{}"
    },
    HTML: {
      200: "<html><head></head><body><h2>Success</h2></body></html>",
      404: "<html><head></head><body><h2>Not Found</h2></body></html>",
      500: "<html><head></head><body><h2>Internal Server Error</h2></body></html>"
    }
  }
  
}