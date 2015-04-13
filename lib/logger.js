
var winston = require('winston');
winston.emitErrs = true;

var defaultLogger = new winston.Logger({
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

module.exports = defaultLogger;
