
var MongoClient = require('mongodb').MongoClient,
    Promise = require('bluebird'),
    config = require('./config'),
    logger = require('./logger')
;

var lib = module.exports;

var db;

lib.connect = function() {
    return new Promise(function(ok, ko) {
        
        var url = config.get('mongodb');
        MongoClient.connect(url, function (err, _db) {

            if(err) {
                logger.error(err);
                return ko(err);
            }

            logger.debug("Connected to %s", url);
            db = _db;
            
            ok(db);
        });        
    });
};

lib.getCollection = function(collectionName) {
    return lib.connection().then(function(conn) {
        return new Promise(function(ok, ko) {
            
            if(!collectionName) {
                return ko(new Error("collectionName not specified"));
            }
            
            conn.collections(function(err, collections) {
                
                if(err) {
                    logger.error(err);
                    return ko(err);
                }
                
                logger.debug("Collection list", collections.length);

                var _exists = collections.filter(function(val) {
                    return val.collectionName === collectionName;
                });
                
                if(_exists.length === 0) {
                    
                    logger.debug("Create new collection");
                    
                    conn.createCollection(collectionName, {}, function(err, Collection) {
                        
                        if(err) {
                            logger.error(err);
                            return ko(err);
                        }
                        
                        logger.debug("Created collection %s", collectionName);
                        return ok(Collection);
                    });

                }
                else {
                    logger.debug("Found collection %s", collectionName);
                    return ok(_exists[0]);
                }

            });

        });
    });
};

lib.connection = function() {
    if(db) {
        return Promise.resolve(db);
    }
    return lib.connect();
};

lib.get = function(args) {
    return lib.getCollection(args.collection).then(function(collection) {
        return new Promise(function(ok, ko) {        
            collection.find({
                userid: args.userid,
                param: args.param
            })
            .toArray(function(err, docs) {

                if(err) {
                    logger.error(err);
                    return ko(err);
                }
                
                logger.debug("value is ", Object.keys(docs));
                return ok(docs);
            });
        });
    });
};

lib.set = function(args, data) {
    return lib.getCollection(args.collection).then(function(collection) {
        
        return lib.get(args).then(function(oldData) {
            
            logger.debug("Previous data", oldData);
                       
            var value = {};
            
            if(!oldData) {
                
                value.userid = args.userid;
                value[ args.param ] = data;
                
                collection
                    .insert(value, function(err) {

                        if(err) {
                            return Promise.reject(err);
                        }

                        return Promise.resolve();
                    });                
            }
            else {
                
                value[ args.param ] = data;
                
                collection
                    .update({ userid: args.userid }, { $set: value }, function(err) {

                        if(err) {
                            return Promise.reject(err);
                        }

                        return Promise.resolve();
                    });            
            }
        });
        
    });
};

lib.remove = function(args) {
    return lib.getCollection(args.collection).then(function(collection) {
    
        return new Promise(function(ok, ko) {

            var value = {
                userid: args.userid,
            };

            collection
                .remove(value, function(err) {

                    if(err) {
                        logger.error(err);
                        return ko(err);
                    }

                    return ok();
                });
            
        });

    });
};

lib.disconnect = function() {

    if(db) {
        logger.debug("Disconnected from db");
        db.close();
        db = null;
    }
    
    return Promise.resolve();
};