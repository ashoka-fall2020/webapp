var winston = require('winston');

const logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            colorize: true,
        })
    ]
});

var options = {
    file: {
        level: 'info',
        filename: `/home/ubuntu/logs/webapp.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(
        info => `TIMESTAMP: ${info.timestamp}, LEVEL:  ${info.level}, MESSAGE: ${info.message}`
    ),
);

var logger = new winston.createLogger({
    format : logFormat,
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message);
    },
};

module.exports = logger;

