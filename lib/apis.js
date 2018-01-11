const lib = module.exports

const Raptor = require("raptor-sdk")
const Promise = require("bluebird")
const dbg = require("debug")("raptor:nodes:config")

const deviceCache = {}
const apiCache = {}

lib.Promise = Promise

const getkey = function (apiConfig) {
    return apiConfig.token + apiConfig.url
}

const getApi = function (apiConfig) {
    return apiCache[getkey(apiConfig)]
}

const setApi = function (apiConfig, api) {
    const _key = getkey(apiConfig)
    apiCache[_key] = api
    deviceCache[_key] = deviceCache[_key] || {}
}

const getDevice = function (apiConfig, objectId) {
    const _key = getkey(apiConfig)
    return getApi(apiConfig) && deviceCache[_key][objectId] ? deviceCache[_key][objectId] : null
}

const setDevice = function (apiConfig, so) {
    if(getApi(apiConfig)) {
        deviceCache[getkey(apiConfig)][so.id] = so
    }
}

lib.get = function (apiConfig) {

    let api = getApi(apiConfig)
    if(api) {
        dbg("Found config " + JSON.stringify(apiConfig))
        return Promise.resolve(api)
    }

    dbg("Adding config " + JSON.stringify(apiConfig))
    api = new Raptor(apiConfig)
    setApi(apiConfig, api)

    return api.Auth().login().then(function() {
        return api
    })
}

lib.getDevice = function (apiConfig, objectId) {
    return lib.get(apiConfig).then(function (api) {

        const so = getDevice(apiConfig, objectId)
        if(so) {
            return Promise.resolve(so).bind(api)
        }

        return lib.get(apiConfig).then(function (api) {
            return api.Inventory().read(objectId).then(function (so) {
                setDevice(apiConfig, so)
                return Promise.resolve(so).bind(api)
            })
        })

    })
}
