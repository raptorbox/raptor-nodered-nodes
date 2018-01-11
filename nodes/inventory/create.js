var apis = require("../../lib/apis")
var util = require("../../lib/util")
var Promise = require("bluebird")

var dbg = require("debug")("raptor:nodes:inventory:create")

module.exports = function (RED) {

    function InventoryCreate(config) {

        RED.nodes.createNode(this, config)

        var node = this

        node.name = config.name
        node.definition = config.definition

        node.api = RED.nodes.getNode(config.api)

        this.on("input", function (msg) {

            if(msg && msg.definition) {
                node.definition = msg.definition
            }

            var definition
            try {
                definition = JSON.parse(node.definition)
            } catch(e) {
                node.error("Cannot parse JSON definition " + e.message)
                return
            }

            dbg("Creating object with definition " + JSON.stringify(definition))

            apis.get(node.api).then(function (api) {

                if(definition.id) {
                    delete definition.id
                }

                return api.Inventory().create(definition).then(function (dev) {
                    node.log("Created " + dev.id)
                    node.send({
                        objectId: dev.id,
                        definition: dev.toJSON(),
                        payload: dev.toJSON()
                    })

                    return Promise.resolve()
                })

            }).catch(function (e) {
                node.error("An error occured loading object: " + e.message)
            })

        })

    }

    RED.nodes.registerType("create-device", InventoryCreate)
}
