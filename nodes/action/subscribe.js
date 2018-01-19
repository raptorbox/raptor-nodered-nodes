var apis = require("../../lib/apis")
var Promise = require("bluebird")
var dbg = require("debug")("raptor:nodes:action:subscribe")

module.exports = function (RED) {

    // track subscriptions and unsubscribe on exit
    var unsubscriptions = []

    function ActionSubscribe(config) {

        config = config || {}
        RED.nodes.createNode(this, config)

        var node = this

        node.api = node.api || {}
        node.name = config.name
        node.deviceId = config.deviceId || node.api.deviceId
        node.action = config.action ? config.action : null

        node.api = RED.nodes.getNode(config.api) || {}

        if(!node.deviceId) {
            node.error("deviceId must be specified")
            return
        }

        if(!node.action) {
            node.error("action name must be specified")
            return
        }

        apis.getDevice(node.api, node.deviceId).then(function (so) {
            return apis.get(node.api).then(function(api) {

                var actionName = node.action
                var action = so.getAction(actionName)

                if(!action) {
                    return Promise.reject(new Error("Action '" + actionName + "' not found in " + so.name))
                }

                dbg("Subscribing to " + actionName)

                var fn = function (data) {
                    node.send({
                        payload: data
                    })
                }

                unsubscriptions.push(function() {
                    return api.Action().unsubscribe(action, fn)
                })

                return api.Action().subscribe(action, fn)
            })
        }).catch(function (err) {
            node.error(err)
        })

        this.on("close", function () {
            Promise.join(unsubscriptions.map(function(fn) {
                return fn()
            })).then(function() {
                dbg("All unsubscribed")
            })
        })

    }

    RED.nodes.registerType("subscribe-action", ActionSubscribe)
}
