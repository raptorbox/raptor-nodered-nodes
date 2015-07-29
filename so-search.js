
var apis = require('./apis');

var util = require('./util');

var dbg = function(m) {
    util.isDebug('sub') && node.log( m );
};

var print = function() {
    util.log.apply(util.log, arguments);
};

var Promise = apis.Promise;

module.exports = function (RED) {

    function SoSearch(config) {

        RED.nodes.createNode(this, config);

        var node = this;

        node.name = config.name;
        node.description = config.description;
        node.query = config.query;

        node.api = RED.nodes.getNode(config.api);
        
        this.on('input', function (msg) {

            dbg("msg " + JSON.stringify(msg));
            
            apis.fromNode(node.api).then(function(api) {

                var params = {};

                if(node.query.length) params.query = node.query;
                if(node.name.length) params.name = node.name;
                if(node.description.length) params.description = node.description;

                api
                .search(params)
                .then(function(res) {

                    node.send({
                        payload: res
                    });                    

                })
                .catch(function(e) {
                    node.error("An error occured during search");
                });
            });
        });

        this.on('close', function () {
            // tidy up any state
            dbg("Closing node");
        });
    };

    RED.nodes.registerType("so-search", SoSearch);
};