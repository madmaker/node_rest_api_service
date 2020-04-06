const winston = require('winston');

module.exports = function() {
  // return new winston.Logger({ transports: transports });
  return winston.createLogger({
    transports: [
      new (winston.transports.Console)({
        timestamp: true,
        colorize: true,
        level: 'debug'
      })//,
      // new (winston.transports.File)(options.errorFile),
      // new (winston.transports.File)(options.file)
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
};