const winston = require('winston');
const os = require("os");

let hostname = os.hostname();
let options = {
    file: {
        level: 'info',
        filename: `/home/ubuntu/logs/webapp.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
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
        info => `HOST: ${hostname}, TIMESTAMP: ${info.timestamp}, LEVEL:  ${info.level}, MESSAGE: ${info.message}`
    ),
);

let logger = new winston.createLogger({
    format : logFormat,
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false,
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;

