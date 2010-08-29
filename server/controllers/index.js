var self = this;

var controllers = {};

this.initialize = function(includes) {
  ['Application', 'Home', 'ExecutionAttempt', 'ExecutionRecord'].each(function(name) {
    name += "Controller";
    var module = require('./' + name.underscore());
    var Class = includes.Prototype.Class;
    var baseKlass = controllers[module.base];
    var extensions = module.extensions
                           .concat( [ module.klass,
                                      { Models: includes.Models} ] )
    var controller = Class.create
                          .curry(baseKlass || {})
                          .apply(Class, extensions);
    console.log("loaded controller: " + name);
    controllers[name] = controller;
  });
  
  return self;
};

// Route prefixes - determines what controller a request will be dispatched to
var routes = {
  '': {
    controller: 'home',
    action: 'index'
  },
  'attempt': {
    'new': {
      controller: 'executionAttempt',
      action: 'new',
      options: {
        parseJSON: true,
        collectBody: true
      }
    }
  },
  'execution': {
    'new': {
      controller: 'executionRecord',
      action: 'new',
      options: {
        parseJSON: true,
        collectBody: true
      }
    }
  }
};

var findMatchingRoute = function(options) {
  var urlChunks = options.parsedUrl.pathname.split('/');
  
  var additionalParameters = {};
  var route = routes;
  var routeFound = true;
  for (var i = 1, len = urlChunks.length; i < len; ++i) {
    var chunk = urlChunks[i];
    route = route[chunk];
    
    if (Object.isFunction(route)) {
      var route = route(additionalParameters);
    } else if (route !== undefined) {
      // Do nothing - a new route object was found
    } else {
      route = { controller: 'application' };
      routeFound = false;
    }
  }
  
  route.additionalParameters = Object.extend(route.additionalParameters || {}, additionalParameters);
  
  return {found:routeFound, route: route};
};

var createAndExecuteControllerInstanceForRoute = function(routing, options) {
  var route = routing.route;
  
  var controller = route.controller[0].toUpperCase() + route.controller.substring(1) + 'Controller';
  var Klass = controllers[controller];
  
  var controllerInstance = new Klass( { request: options.request,
                                        response: options.response,
                                        parsedUrl: options.parsedUrl,
                                        additionalParameters: route.additionalParameters,
                                        actionName: route.action,
                                        controllerName: route.controller }, route.options );
  
  if (routing.found) {
    try {
      controllerInstance.executeFilterChain(route.action);
    } catch (e) {
      console.log("Caught error: " + e + " while executing action: " + route.action + " for controller " + controller);
      if (!controllerInstance.rendered) {
        controllerInstance.renderError({ errorCode: 500 });
      }
      if (!controllerInstance.finalized) {
        controllerInstance.finalize();
      }
    }
  } else {
    controllerInstance.renderError({ errorCode: 404 });
    controllerInstance.finalize();
  }
}

this.dispatchToController = function(options) {
  var routing = findMatchingRoute(options);
  var route = routing.route;
    
  console.log("Determined routing controller: " + route.controller);
  console.log("Determined routing action: " + route.action);
  
  if (route.options && route.options.collectBody) {
    var chunks = [];
    options.request.addListener('data', function(data) {
      chunks.push(data);
    });
    options.request.addListener('end', function() {
      options.request.completeBody = chunks.join('');
      console.log("complete body:");
      console.log(options.request.completeBody);
      createAndExecuteControllerInstanceForRoute(routing, options);
    });
  } else {
    createAndExecuteControllerInstanceForRoute(routing, options);
  }
};