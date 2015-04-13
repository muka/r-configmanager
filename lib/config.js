
var logger = require('./logger')
    _ = require('lodash')
;

var lib = module.exports;

var config = {};

lib.load = function(_config) {
    _.merge(config, _config);    
    return config;
};

lib.get = function(k) {
    return k ? config[k] : config;
};

