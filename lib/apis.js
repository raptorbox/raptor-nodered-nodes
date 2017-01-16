
var lib = module.exports;

var raptor = require('raptor');
var Promise = require('bluebird');

var soCache = {};
var apiCache = {};

lib.Promise = Promise;

var getkey = function(apiConfig) {
    return apiConfig.apiKey + apiConfig.transport + apiConfig.url;
};

var getApi = function(apiConfig) {
    return apiCache[ getkey(apiConfig) ];
};

var setApi = function(apiConfig, api) {
    var _key = getkey(apiConfig);
    apiCache[ _key ] = api;
    soCache[ _key ] = soCache[ _key ] || {};
};

var getSO = function(apiConfig, soid) {
    var _key = getkey(apiConfig);
    return getApi(apiConfig) && soCache[ _key ][ soid ] ? soCache[ _key ][ soid ] : null;
};

var setSO = function(apiConfig, so) {
    if(getApi(apiConfig)) {
        soCache[ getkey(apiConfig) ][ so.id ] = so.toJson();
    }
};

lib.get = function(apiConfig) {

    var api = getApi(apiConfig);
    if(api) {
        return Promise.resolve(api);
    }

    api = new Raptor(apiConfig);
    setApi(apiConfig, api);

    var loginPromise = Promise.resolve(api);

    if(!apiConfig.token && (apiConfig.username && apiConfig.password)) {
      return api.getUser(apiConfig).then(loginPromise)
    }

    return loginPromise;
};

lib.fromNode = function(node) {
    return lib.get({
        apiKey: node.apiKey,
        url: node.url || "https://api.raptor.local",
    });
};

lib.getServiceObject = function(apiConfig, soid) {
    return lib.get(apiConfig).then(function(api) {

        var so = getSO(apiConfig, soid);
        if(so) {
            return Promise.resolve(new api.ServiceObject(so)).bind(api);
        }

        return api.load(soid).then(function(so) {
            setSO(apiConfig, so);
            return Promise.resolve(so).bind(api);
        });
    });
};
