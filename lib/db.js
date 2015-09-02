
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

    if(!collectionName) {
        return Promise.reject(new Error("collectionName not specified"));
    }

    return lib.connection().then(function(conn) {
        return Promise.resolve(conn.collection(collectionName));
    });
};

lib.getCollections = function(collectionName) {
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
                return ok(collections);
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

            var criteria = {
                configManagerGroup: args.group,
            };

            logger.debug("Query: %s", JSON.stringify(criteria));

            collection.find(criteria)
            .limit(1)
            .next(function(err, doc) {

                if(err) {
                    logger.error(err);
                    ko(err);
                    return false;
                }

                doc && delete doc._id
                logger.debug("Raw result: %s", JSON.stringify(doc));

                ok(doc);
                return false;
            })
        })
    })
}

lib.set = function(args, data) {
    return lib.getCollection(args.collection).then(function(collection) {

        return lib.get(args).then(function(oldData) {

            var configManagerGroup = args.group
            var updateCriteria = { "configManagerGroup": configManagerGroup }

            var getValue = function() {

                var value = {}

                if(args.param) {
                    value[ args.param ] = data

                }
                else {
                    value = data
                }

                value.configManagerGroup = configManagerGroup

                return value
            };

            if(!oldData || oldData.length === 0) {

                var value = getValue()
                logger.debug("Creating new record in %s.%s:",
                        collection.collectionName, configManagerGroup, JSON.stringify(value))

                collection
                    .insertOne(value, function(err) {
                        if(err) return Promise.reject(err)
                        return Promise.resolve();
                    })
            }
            else {

                var value = getValue()
                logger.debug("Updating record in %s.%s:",
                            collection.collectionName, configManagerGroup, JSON.stringify(value))

                collection
                    .update(updateCriteria, { $set: value }, function(err) {

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
        return lib.get(args).then(function(doc){
            return new Promise(function(ok, ko) {

                var value = {
                    configManagerGroup: args.group
                };

                if(doc && args.param && typeof doc[args.param] !== undefined) {
                    value[args.param] = doc[args.param];
                }

                logger.debug("Remove by ", JSON.stringify(value));
                collection
                    .findOneAndDelete(value, function(err) {

                        if(err) {
                            logger.error(err);
                            return ko(err);
                        }

                        logger.debug("Record removed");
                        return ok();
                    });

            });
        });

    });
};

lib.disconnect = lib.close = function() {

    if(db) {
        logger.debug("Disconnected from db");
        db.close();
        db = null;
    }

    return Promise.resolve();
};
