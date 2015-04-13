

var server = require('./lib/server'),
    config = require('./lib/config'),
    logger = require('./lib/logger'),
    db = require('./lib/db')
;

config.load(require('./config.json'));

db.connection().then(function(c) {
    c.collection('coll').find({}).toArray(function(err, res) {
        console.log(err, res);
    });
});

server.start().then(function(app) {

    var _get = function(req, res) {
        logger.debug("Read param");
        db.get(req.params)
            .then(function(data) {
                logger.debug("Got", data);                
                res.status(200).send(data);
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
        
    };
    
    var _create = function(req, res) {
        logger.debug("Set param");
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

    app.get('/:userid/:collection/:param', _get);
    app.post('/:userid/:collection/:param', _create);
    app.put('/:userid/:collection/:param', _create);
    app.delete('/:userid/:collection/:param', _delete);
    
});