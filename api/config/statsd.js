
var SDC = require('statsd-client'),
    sdc = new SDC({host: 'localhost', port: 8124});

module.exports = sdc;