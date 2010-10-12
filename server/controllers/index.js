var self = this;

var controllers = {};

this.initialize = function(includes) {
  ['Application', 'Home', 'ExecutionAttempt', 'ExecutionRecord',
   'ExecutionModule', 'User', 'ModuleLoad'].each(function(name) {
    name += "Controller";
    var module = require('./' + name.underscore());
    var Class = includes.Prototype.Class;
    var baseKlass = controllers[module.base];
    var extensions = module.extensions
                           .concat( [ module.klass, includes ] )
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
      methods: ['POST', 'PUT'],
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
      methods: ['POST', 'PUT'],
      controller: 'executionRecord',
      action: 'new',
      options: {
        parseJSON: true,
        collectBody: true
      }
    }
  },
  'user': {
    'new': function(request, additionalParameters) {
      var route = {
        controller: 'user',
        action: 'new',
        options: {},
        additionalParameters: additionalParameters
      };
      if (request.method == 'POST' || request.method == 'PUT') {
        route.options = {
          parsePOST: true,
          collectBody: true
        };
      }
      return route;
    }
  },
  'module': {
    'new': function(request, additionalParameters) {
      var route = {
        controller: 'executionModule',
        action: 'new',
        options: {},
        additionalParameters: additionalParameters
      };
      if (request.method == 'POST' || request.method == 'PUT') {
        route.options = {
          parsePOST: true,
          collectBody: true
        };
      }
      return route;
    },
    'load': function(request, additionalParameters) {
      var route = {
        methods: ['POST', 'PUT'],
        controller: 'moduleLoad',
        action: 'load',
        options: {},
        additionalParameters: additionalParameters
      };
      if (request.method == 'POST' || request.method == 'PUT') {
        route.options = {
          parseJSON: true,
          collectBody: true
        };
      }
      return route;
    }
  },
  'load_attempt': {
    'new': function(request, additionalParameters) {
      var route = {
        methods: ['POST', 'PUT'],
        controller: 'moduleLoad',
        action: 'new',
        options: {},
        additionalParameters: additionalParameters
      };
      if (request.method == 'POST' || request.method == 'PUT') {
        route.options = {
          parseJSON: true,
          collectBody: true
        };
      }
      return route;
    }
  }
};

var findMatchingRoute = function(options) {
  var urlChunks = options.parsedUrl.pathname.split('/');
  
  var request = options.request;
  var additionalParameters = {};
  var route = routes;
  var routeFound = true;
  for (var i = 1, len = urlChunks.length; i < len; ++i) {
    var chunk = urlChunks[i];
    route = route[chunk];
    
    if (Object.isFunction(route)) {
      route = route(request, additionalParameters);
    }
    
    if (route === undefined || (route.methods && !route.methods.include(request.method))) {
      console.log("no route found");
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
    
  console.log("Determined routing controller: " + route.controller + " with action: " + route.action);
  
  if (routing.found) {
    if (route.options && route.options.collectBody) {
      console.log('collecting body');
      var chunks = [];
      options.request.addListener('end', function() {
        console.log('listen end');
        options.request.completeBody = chunks.join('');
        createAndExecuteControllerInstanceForRoute(routing, options);
      });
      options.request.addListener('data', function(data) {
        console.log('listen data');
        chunks.push(data);
      });
    } else {
      createAndExecuteControllerInstanceForRoute(routing, options);
    }
  } else {
    if (options.onNoRoute) {
      options.onNoRoute();
    } else {
      createAndExecuteControllerInstanceForRoute(routing, options);
    }
  }
  
};