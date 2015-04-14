

var server = require('./lib/server'),
    config = require('./lib/config'),
    logger = require('./lib/logger'),
    db = require('./lib/db')
;

config.load(require('./config.json'));

server.start().then(function(app) {

    var _get = function(req, res) {
        logger.debug("Read param");
        db.get(req.params)
            .then(function(record) {
                
                var key = req.params.param;
                var val;
                
                if(record) {
                    if(key) {
                        val = record[ key ];
                    }
                    else {
                        val = {};
                        Object.keys(record).forEach(function(field) {
                            if( field === '_id' || field === 'group' ) return;
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
        
        logger.debug("Create param", JSON.stringify(req.body));
        db.remove(req.params).then(function() {
            
            db.set(req.params, req.body)
                .then(function(data) {
                    res.status(200).send(data);
                })
                .catch(function(err) {
                    res.status(500).send(err);
                });

        });
    };
    
    var _update = function(req, res) {
        
        logger.debug("Update param", JSON.stringify(req.body));
        
        db.set(req.params, req.body)
            .then(function(data) {
                res.status(200).send(data);
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
    };
    
    var _delete = function(req, res) {
        logger.debug("Delete param");
        db.remove(req.params, req.body)
            .then(function(data) {
                res.status(200).send(data);
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
    };

    app.get('/:collection/:group/:param', _get);
    app.get('/:collection/:group', _get);

    app.post('/:collection/:group/:param', _create);
    app.post('/:collection/:group', _create);
    
    app.put('/:collection/:group/:param', _update);
    app.put('/:collection/:group', _update);

    app.delete('/:collection/:group/:param', _delete);
    app.delete('/:collection/:group', _delete);
    
    
});

process.on('SIGINT', function() {
    db.disconnect().then(function() {
        logger.debug("Disconnected");
        process.exit(0);
    });
});