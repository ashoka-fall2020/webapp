const SDC = require('statsd-client'),
    sdc = new SDC({host: 'localhost', port: 8125});

module.exports = sdc;