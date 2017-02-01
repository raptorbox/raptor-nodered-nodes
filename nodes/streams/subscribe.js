var apis = require('../../lib/apis');
var util = require('../../lib/util');

var Promise = require("bluebird")

var dbg = require("debug")("raptor:nodes:stream:subscribe")

module.exports = function (RED) {

  // track subscriptions and unsubscribe on exit
  var unsubscriptions = [];

  function StreamSubscribe(config) {

    RED.nodes.createNode(this, config);

    var node = this;

    node.name = config.name;
    node.objectId = config.objectId;
    node.stream = config.stream ? config.stream : null;

    node.api = RED.nodes.getNode(config.api);

    if(!node.objectId) {
      node.objectId = node.api.objectId;
    }

    if(!node.objectId) {
      node.error("objectId must be specified");
      return
    }

    if(!node.stream) {
      node.error("stream name must be specified");
      return
    }

    apis.getServiceObject(node.api, node.objectId)
      .then(function (so) {

        var api = this;

        var streamName = node.stream;
        var stream = so.stream(streamName);

        if(!stream) {
          return Promise.reject(new Error("Stream '" + streamName + "' not found in " + so.name));
        }

        dbg("Subscribing to " + streamName);

        var fn = function (data) {
          node.send({
            payload: data
          });
        };

        unsubscriptions.push(function() {
          return stream.unsubscribe(fn);
        })

        return stream.subscribe(fn);
      })
      .catch(function (err) {
        node.error(err);
      });

    this.on('close', function () {

      // tidy up any state
      dbg("Closing node");

      Promise.join(unsubscriptions.map(function(fn) {
        return fn();
      }))
      .then(function() {
        dbg("All unsubscribed");
      });

    });

  };

  RED.nodes.registerType("stream-subscribe", StreamSubscribe);
};
