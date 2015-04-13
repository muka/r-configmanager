
var express = require('express'),
    Promise = require('bluebird'),
    bodyParser = require('body-parser'),    
    config = require('./config'),
    logger = require('./logger')
;

var lib = module.exports;

var app;

lib.start = function() {
    
    if(app) {
        return Promise.resolve(app);
    }
    
    return new Promise(function(ok, ko) {
        
        app = express();
        
        app.use(bodyParser.json());
        
        app.listen(config.get('port'), config.get('host'), function() {
            logger.debug("Listening on http://%s:%s", config.get('host'), config.get('port'));
            ok(app);
        });
    });
};