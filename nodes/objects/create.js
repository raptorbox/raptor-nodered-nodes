var apis = require('../../lib/apis');
var util = require('../../lib/util');

var dbg = require("raptor:nodes:objects:create")

module.exports = function (RED) {

  function SoCreate(config) {

    RED.nodes.createNode(this, config);

    var node = this;

    node.name = config.name;
    node.definition = config.definition;

    node.api = RED.nodes.getNode(config.api);

    this.on('input', function (msg) {

      dbg("msg " + JSON.stringify(msg));

      if(msg.payload) {
        node.definition = msg.payload;
      }

      apis.fromNode(node.api).then(function (api) {

          var json;
          try {
            json = JSON.parse(node.definition);
          } catch(e) {
            return api.lib.Promise.reject(new Error("Cannot parse JSON definition"));
          }

          if(json.id) {
            delete json.id;
          }

          return api.create(json).then(function (so) {

            node.send({
              soid: so.id,
              so: so.toJson(),
              payload: json
            });

            return api.lib.Promise.resolve();
          });

        })
        .catch(function (e) {
          node.error("An error occured loading object");
          node.error(e.message);
        });

    });

    this.on('close', function () {
      // tidy up any state
      dbg("Closing node");
    });
  };

  RED.nodes.registerType("so-create", SoCreate);
};
