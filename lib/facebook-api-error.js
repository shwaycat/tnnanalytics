var util = require('util');

/**
 * Facebook API Error
 * @class
 * @augments Error
 * @see https://developers.google.com/analytics/devguides/reporting/core/v3/coreErrors
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */

/**
 * @constructs FacebookAPIError
 * @param {Object} body - Response body with error
 * @param {String} body.error.message - Error message
 * @param {String} [body.error.type] - Error type
 * @param {String} [body.error.code] - Error status code
 * @param {String} [body.error.fbtrace_id] - Facebook error trace ID
 */
function FacebookAPIError(body) {
  /**
   * @member {String} name
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
   */
  this.name = 'FacebookAPIError';

  Error.call(this);

  /**
   * @member {String} message
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/message
   */
  this.message = body.error.message;

  /**
   * Error type
   * @member {String} type
   */
  this.type = body.error.type;

  /**
   * Error status code
   * @member {Number} code
   */
  this.code = body.error.code;

  /**
   * Facebook Error trace identifier
   * @member {String} fbtrace_id
   */
  this.fbtrace_id = body.error.fbtrace_id;

  /**
   * @member {String} stack
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
   */
  var stackMessage = util.format("%s (%s): %s\n", this.name, this.code, this.message);
  this.stack = (new Error()).stack.replace(/^(.+\n){2}/m, stackMessage);
}

util.inherits(FacebookAPIError, Error);

module.exports = FacebookAPIError;
