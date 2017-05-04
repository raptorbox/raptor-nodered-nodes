var apis = require('../../lib/apis');
var util = require('../../lib/util');
var Promise = require('bluebird');

var dbg = require("debug")("raptor:nodes:stream:push")

module.exports = function (RED) {

  function StreamPush(config) {

    RED.nodes.createNode(this, config);

    var node = this;

    node.name = config.name;
    node.objectId = config.objectId;
    node.stream = config.stream && config.stream.length ? config.stream : null;
    node.api = RED.nodes.getNode(config.api);

    if(!node.api) {
      node.error("stream.push node is not configured")
      return
    }

    if(!node.objectId) {
      node.objectId = node.api.objectId;
    }

    this.on('input', function (msg) {

      var info = util.parsePayload(msg, node);

      var channelsData;

      // will be used as value for lastUpdate if not specified
      var timestamp = new Date;
      var rawdata = msg.payload;

      dbg("msg " + JSON.stringify(msg));

      if(info.data) {
        channelsData = info.data;
      } else if(typeof rawdata === 'string') {

        dbg("Parse payload json: " + rawdata);

        try {
          channelsData = JSON.parse(rawdata);
        } catch(e) {

          node.error("Cannot parse payload: ");
          node.error(e);

          dbg(rawdata);

          channelsData = null;
        }
      }

      if(channelsData && Object.keys(channelsData).length > 0) {

        apis.getServiceObject(node.api, node.objectId)
          .then(function (so) {

            var api = this;

            var stream = null;
            var streamName = node.stream;
            if(msg.topic) {
              stream = so.stream(msg.topic);
              if(stream) {
                streamName = msg.topic;
              }
            }

            if(!stream) {
              stream = so.stream(streamName);
            }

            if(!stream) {
              return Promise.reject(new Error("Stream '" + streamName + "' not found in " + so.name));
            }

            dbg("Push data to " + so.id + "." + streamName);
            dbg(JSON.stringify(channelsData));

            if(channelsData.lastUpdate) {
              timestamp = new Date(channelsData.lastUpdate);
              channelsData = channelsData.channels;
            }

            return stream.push(channelsData, timestamp);
          })
          .then(function (res) {
            dbg("Data sent to " + node.objectId);
            dbg(JSON.stringify(res));
          })
          .catch(function (err) {
            node.error(err);
          });

      } else {
        node.warn("Payload data cannot be read, push skipped");
      }

    });

    this.on('close', function () {
      // tidy up any state
      dbg("Closing node");
    });

  };

  RED.nodes.registerType("stream-push", StreamPush);
};
