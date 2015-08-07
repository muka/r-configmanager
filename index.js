
var configure = function (conf) {
    var config = require('./lib/config')
    config.load(conf)
}

var mount = function (app) {

    var config = require('./lib/config')
    var db = require('./lib/db')
    var logger = require('./lib/logger')

    var _get = function (req, res) {
        logger.debug("Read data");
        db.get(req.params)
            .then(function (record) {

                var key = req.params.param;
                var val = null;

                if(record) {
                    if(key) {

                        if(record[key] instanceof Array || typeof record[key] === 'object') {
                            val = JSON.stringify(record[key]);
                        } else if(record[key] === undefined) {
                            val = null;
                        } else {
                            val = record[key].toString();
                        }

                    } else {
                        val = {};
                        Object.keys(record).forEach(function (field) {
                            if(field === '_id') return;
                            val[field] = record[field];
                        });
                    }

                    logger.debug("Got result", val);
                    res.status(200).send(val);

                } else {

                    logger.debug("Value is empty", record);
                    res.status(204).send();

                }

            })
            .catch(function (err) {
                logger.error(err);
                res.status(500).send(err);
            });

    };

    var _create = function (req, res) {

        logger.debug("Create data", JSON.stringify(req.body));
        db.remove(req.params).then(function () {

                return db.set(req.params, req.body)
                    .then(function (data) {
                        res.status(200).send();
                    })

            })
            .catch(function (err) {
                logger.error(err);
                res.status(500).send(err);
            });

    };

    var _update = function (req, res) {

        logger.debug("Update data", JSON.stringify(req.body));

        db.set(req.params, req.body)
            .then(function (data) {
                res.status(200).send();
            })
            .catch(function (err) {
                logger.error(err);
                res.status(500).send(err);
            });
    };

    var _delete = function (req, res) {
        logger.debug("Delete data");
        db.remove(req.params, req.body)
            .then(function (data) {
                res.status(200).send();
            })
            .catch(function (err) {
                logger.error(err);
                res.status(500).send(err);
            });
    };

    var apiBasePath = config.get("apiBasePath") || ""
    app.get(apiBasePath + '/:group/:collection/:param', _get);
    app.get(apiBasePath + '/:group/:collection', _get);

    app.post(apiBasePath + '/:group/:collection/:param', _create);
    app.post(apiBasePath + '/:group/:collection', _create);

    app.put(apiBasePath + '/:group/:collection/:param', _update);
    app.put(apiBasePath + '/:group/:collection', _update);

    app.delete(apiBasePath + '/:group/:collection/:param', _delete);
    app.delete(apiBasePath + '/:group/:collection', _delete);

}

var setLogger = function (log) {
    var logger = require('./lib/logger').setLogger(log)
}

var start = function (conf) {

    configure(conf || require('./config.json'));

    var logger = require('./lib/logger').createDefaultLogger()
    var server = require('./lib/server')

    server.start().then(mount);
    process.on('SIGINT', function () {
        try {
            stop();
        } catch(e) {
            console.error(e)
            process.exit()
        }
    });
}

var stop = function () {
    var db = require('./lib/db')
    db.disconnect().then(function () {
        logger.debug("Disconnected");
        process.exit(0);
    });
}

module.exports.start = start
module.exports.stop = stop
module.exports.mount = mount
module.exports.configure = configure
module.exports.setLogger = setLogger
