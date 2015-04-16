

var server = require('./lib/server'),
    config = require('./lib/config'),
    logger = require('./lib/logger'),
    db = require('./lib/db')
;

config.load(require('./config.json'));

server.start().then(function(app) {

    var _get = function(req, res) {
        logger.debug("Read data");
        db.get(req.params)
            .then(function(record) {

                var key = req.params.param;
                var val = null;

                if(record) {

                    if(key) {


                        if(record[ key ] instanceof Array || typeof record[ key ] === 'object') {
                            val = JSON.stringify(record[ key ]);
                        }
                        else if(record[ key ] === undefined) {
                            val = null;
                        }
                        else {
                            val = record[ key ].toString();
                        }

                    }
                    else {
                        val = {};
                        Object.keys(record).forEach(function(field) {
                            if( field === '_id') return;
                            val[field] = record[field];
                        });
                    }

                    logger.debug("Got result", val);
                }
                else {
                    logger.debug("Value is empty", record);
                }

                res.status(200).send(val);
            })
            .catch(function(err) {
                logger.error(err);
                res.status(500).send(err);
            });

    };

    var _create = function(req, res) {

        logger.debug("Create data", JSON.stringify(req.body));
        db.remove(req.params).then(function() {

            return db.set(req.params, req.body)
                .then(function(data) {
                    res.status(200).send();
                })

        })
        .catch(function(err) {
            logger.error(err);
            res.status(500).send(err);
        });

    };

    var _update = function(req, res) {

        logger.debug("Update data", JSON.stringify(req.body));

        db.set(req.params, req.body)
            .then(function(data) {
                res.status(200).send();
            })
            .catch(function(err) {
                logger.error(err);
                res.status(500).send(err);
            });
    };

    var _delete = function(req, res) {
        logger.debug("Delete data");
        db.remove(req.params, req.body)
            .then(function(data) {
                res.status(200).send();
            })
            .catch(function(err) {
                logger.error(err);
                res.status(500).send(err);
            });
    };

    app.get('/:group/:collection/:param', _get);
    app.get('/:group/:collection', _get);

    app.post('/:group/:collection/:param', _create);
    app.post('/:group/:collection', _create);

    app.put('/:group/:collection/:param', _update);
    app.put('/:group/:collection', _update);

    app.delete('/:group/:collection/:param', _delete);
    app.delete('/:group/:collection', _delete);


});

process.on('SIGINT', function() {
    db.disconnect().then(function() {
        logger.debug("Disconnected");
        process.exit(0);
    });
});