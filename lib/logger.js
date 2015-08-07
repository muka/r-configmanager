
var createLogger = function() {

    var winston = require('winston');
    winston.emitErrs = true;

    var logger = new winston.Logger({
        transports: [
            new winston.transports.File({
                level: 'info',
                filename: __dirname + '/../logs/all-logs.log',
    //            handleExceptions: true,
                handleExceptions: false,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.Console({
                level: 'debug',
    //            handleExceptions: true,
                handleExceptions: false,
                json: false,
                colorize: true
            })
        ],
        exitOnError: false
    });

    return logger
}

var createDefaultLogger = function() {
    setLogger(createLogger())
}

var setLogger = function(logger) {
    module.exports = logger
    module.exports.setLogger = setLogger;
    module.exports.get = function() { return logger };
    module.exports.createLogger = createLogger;
    module.exports.createDefaultLogger = createDefaultLogger;
}

setLogger({})
