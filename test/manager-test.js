
var rp = require('request-promise')
var assert = require('assert')
var ConfigManagerClient = require('config-manager-client')

var manager = require('../index')
var config = require('./config.test.json')

var client
var def = {
    group: 'test',
    collection: 'mytest',
    param: 'myquestion',
    value: { value: 42 }
}

before(function(done) {

    var manager_uri = 'http://' + config.host + ':' + config.port + (config.apiBasePath || '')
    var clientConfig = {
        baseUrl: manager_uri,
        group: def.group,
        userid: def.collection
    }

    client = new ConfigManagerClient(clientConfig)
    manager.start(config)
    done()
})

after(function(done) {
    manager.stop()
    done()
})

describe('ConfigManager API', function () {

    describe('save data', function () {

        it('should store a configuration', function (done) {

            return client
                .set(def.param, def.value)
                .then(function() {
                    return client.get(def.param)
                })
                .then(function(raw) {
                    var value = raw && raw.value ? raw.value : null
                    assert.equal(value, def.value.value)
                    done()
                })
                .catch(done)

        })

        it('should update a configuration', function (done) {

            var newValue = { value: def.value.value * 2 }

            return client
                .set(def.param, newValue)
                .then(function() {
                    return client.get(def.param)
                })
                .then(function(raw) {
                    var value = raw && raw.value ? raw.value : null
                    assert.equal(value, newValue.value)
                    done()
                })
                .catch(done)
        })

    })

    describe('delete data', function () {

        it('should remove a configuration', function (done) {

            return client
                .remove(def.param)
                .then(function() {
                    return client.get(def.param)
                })
                .then(function(raw) {
                    assert.equal(raw, null)
                    done()
                })
                .catch(done)

        })

    })

})
