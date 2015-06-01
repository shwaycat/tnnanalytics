var util = require('util');

/**
 * Google API Error
 * @class
 * @augments Error
 * @see https://developers.google.com/analytics/devguides/reporting/core/v3/coreErrors
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */

/**
 * @constructs GoogleAPIError
 * @param {Object} body - Response body with error
 * @param {String} body.error.message - Error message
 * @param {String} [body.error.code] - Error status code
 * @param {String} [body.error.errors] - Array of error details
 */
function GoogleAPIError(body) {
  /**
   * @member {String} name
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
   */
  this.name = 'GoogleAPIError';

  /**
   * @member {String} message
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/message
   */
  if ('string' === typeof body.error) {
    this.message = util.format('%s - %s', body.error, body.error_description);
  } else {
    this.message = body.error.message;
  }

  Error.call(this, this.message);

  /**
   * Error status code
   * @member {Number} code
   */
  this.code = body.error.code;

  /**
   * @member {String} stack
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
   */
  var stackMessage = util.format("%s (%s): %s\n", this.name, this.code, this.message);
  this.stack = (new Error()).stack.replace(/^(.+\n){2}/m, stackMessage);

  /**
   * Error status details
   * @member {Array<Obect>} details
   */
  this.details = body.error.errors;
}

util.inherits(GoogleAPIError, Error);

module.exports = GoogleAPIError;
