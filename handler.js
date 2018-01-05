'use strict';

const newman = require('newman');
const config = require('config');
const logger = require('winston');
const uuidv4 = require('uuid/v4');

const testCollection = config.get("testSuite")
const logLevel = config.get("logLevel")
const testEnvironmentVariablesConfig = config.get("testEnvironmentVariables")

const getNewmanTestEnvironmentObject = function(testEnvironmentObject) {
 const uuid = uuidv4()
  return {
  "id": uuid,
  "name": "auto-generated-" + uuid,
  "values": Object.keys(testEnvironmentObject).map(environmentKey => {
    return {
      "enabled": true,
      "key": environmentKey,
      "value": testEnvironmentObject[environmentKey],
      "type": "text"
    }
  })
}
}

module.exports.runNewmanTest = (event, context, callback) => {
  
  const testEnvironmentVariablesEvent = event.testEnvironmentVariables || {}

  // merge test environment variables from config and event 
  const testEnvironmentVariables = Object.assign({}, testEnvironmentVariablesConfig, testEnvironmentVariablesEvent)
  
  newman.run({
    collection: testCollection,
    reporters: 'winston',
    noColor: true,
    environment: getNewmanTestEnvironmentObject(testEnvironmentVariables),
    reporter: {
      winston: {
        level: logLevel
      }
    }
  }).on('start', function (err, args) {
    logger.debug('Start newman run');
  }).on('done', function (err, summary) {
    if (err || summary.error) {
      logger.error('collection run encountered an error.');
      callback('Newman test run encountered an error.', null)
    } else {
      if (summary.run.failures.length > 0) {
        callback(`Test run failed with ${summary.run.failures.length} failures`)
      } else {
        callback(null, 'Test run passed!')
      }
      logger.debug("Finished newman run")
    }
  });
};
