let {loggingPort}=require('../config.json')
const winston= require('winston');
const os = require('os');
//const winston = require('winston');
require('winston-syslog');

const papertrail = new winston.transports.Syslog({
  host: 'logs4.papertrailapp.com',
  port: 43538,
  protocol: 'tls4',
  localhost: os.hostname(),
  eol: '\n',
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
  levels: winston.config.syslog.levels,
  transports: [papertrail],
  exceptionHandlers:[papertrail]
});

function MultiSink(statement:string,level:string=undefined)
{
  if(!level) level="INFO";
  level=level.toUpperCase();
//heroku specific sink
console.log(`${level}: ${statement}`);

//papertrial specif sink
switch(level)
{
  case "ERROR" : {
    logger.error(statement);
    break;
  }
  case "INFO" :
  {
    logger.info(statement);
    break;
  }
  default :
  {
    logger.info(statement);
  }
}


}

module.exports=MultiSink;