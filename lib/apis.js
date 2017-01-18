var lib = module.exports;

var Raptor = require('raptor');
var Promise = require('bluebird');
var dbg = require('debug')("raptor:nodes:config")

var soCache = {};
var apiCache = {};

lib.Promise = Promise;

var getkey = function (apiConfig) {
  return apiConfig.apiKey + apiConfig.url;
};

var getApi = function (apiConfig) {
  return apiCache[getkey(apiConfig)];
};

var setApi = function (apiConfig, api) {
  var _key = getkey(apiConfig);
  apiCache[_key] = api;
  soCache[_key] = soCache[_key] || {};
};

var getSO = function (apiConfig, objectId) {
  var _key = getkey(apiConfig);
  return getApi(apiConfig) && soCache[_key][objectId] ? soCache[_key][objectId] : null;
};

var setSO = function (apiConfig, so) {
  if(getApi(apiConfig)) {
    soCache[getkey(apiConfig)][so.id] = so.toJSON();
  }
};

lib.get = function (apiConfig) {

  var api = getApi(apiConfig);
  if(api) {
    dbg("Found config " + JSON.stringify(apiConfig))
    return Promise.resolve(api);
  }

  dbg("Adding config " + JSON.stringify(apiConfig))
  api = new Raptor(apiConfig);
  setApi(apiConfig, api);

  var loginPromise = Promise.resolve(api);

  if(!apiConfig.token && (apiConfig.username && apiConfig.password)) {
    return api.getUser(apiConfig).then(loginPromise)
  }

  return loginPromise;
};

lib.getServiceObject = function (apiConfig, objectId) {
  return lib.get(apiConfig).then(function (api) {

    var so = getSO(apiConfig, objectId);
    if(so) {
      return Promise.resolve(api.fromJSON(so)).bind(api);
    }

    return api.load(objectId).then(function (so) {
      setSO(apiConfig, so);
      return Promise.resolve(so).bind(api);
    });
  });
};
