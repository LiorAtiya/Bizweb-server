const winston = require('winston');
const path = require('path');
const { combine, timestamp, printf } = winston.format;

const logsDir = path.join(__dirname);

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
    ]
});

module.exports = logger;