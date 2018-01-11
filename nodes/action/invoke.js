var apis = require("../../lib/apis")
var util = require("../../lib/util")

var Promise = require("bluebird")
var dbg = require("debug")("raptor:nodes:action")

module.exports = function (RED) {

    function ActionInvoke(config) {

        RED.nodes.createNode(this, config)

        var node = this

        node.name = config.name
        //        node.body = config.body;

        node.api = RED.nodes.getNode(config.api)

        node.objectId = config.objectId
        if(!node.objectId) {
            node.objectId = node.api.objectId
        }

        this.on("input", function (msg) {

            dbg("msg " + JSON.stringify(msg))

            apis.getServiceObject(node.api, node.objectId)
                .then(function (so) {

                    var api = this

                    var actionName = node.name
                    var action = so.getAction(actionName)

                    if(!action) {
                        return api.lib.Promise.reject(new Error("Action '" + actionName + "' not found in " + so.name))
                    }

                    dbg("Executing " + actionName + ": " + msg.payload.toString())
                    return action.invoke(msg.payload).then(function () {
                        dbg("Action invoked")
                    })
                })
                .catch(function (err) {
                    node.error(err)
                    dbg(err)
                })

        })

        this.on("close", function () {
            // tidy up any state
            dbg("Closing node")

        })

    }

    RED.nodes.registerType("action-invoke", ActionInvoke)
}
