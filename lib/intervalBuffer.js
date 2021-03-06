'use strict'

var _ = require('lodash')
var Promise = require('bluebird')

function IntervalBuffer (options) {
  var self = this

  self.messageHandler = options.messageHandler || _.noop
  self.closeHandler = options.closeHandler
  self.errorHandler = options.errorHandler
  self.mock = options.mock && options.mock === true
  self.maxBufferSize = options.maxBufferSize || 0
  self.bufferFlushInterval = options.bufferFlushInterval || 1000
  self.bufferHolder = options.bufferHolder ? options.bufferHolder : { buffer: '' }

  if (self.maxBufferSize > 0) {
    self.intervalHandle = setInterval(this.onBufferFlushInterval.bind(this), self.bufferFlushInterval)
  }
}

/**
 * Send a message to IntervalBuffer
 * @param message {String} The constructed message without tags
 */
IntervalBuffer.prototype.send = function (message) {
  var self = this
  // Only send this message if we're not a mock.
  if (!self.mock) {
    if (self.maxBufferSize === 0) {
      return self._send(message)
    }
    return self.enqueue(message)
  }
  return Promise.resolve()
}

/**
 * Add the message to the buffer and flush the buffer if needed
 *
 * @param message {String} The constructed message without tags
 */
IntervalBuffer.prototype.enqueue = function (message) {
  var self = this
  message += '\n'

  if (self.bufferHolder.buffer.length + message.length > self.maxBufferSize) {
    return self.flushQueue()
      .then(function () {
        self.bufferHolder.buffer += message
        return Promise.resolve()
      })
  }
  self.bufferHolder.buffer += message
  return Promise.resolve()
}

/**
 * Flush the buffer, sending on the messages
 */
IntervalBuffer.prototype.flushQueue = function () {
  var self = this
  return self._send(self.bufferHolder.buffer)
    .then(function () {
      self.bufferHolder.buffer = ''
      return Promise.resolve()
    })
}

/**
 * Send on the message through the messageHandler.
 * Internal function
 *
 * @param message {String} The message
 */
IntervalBuffer.prototype._send = function (message) {
  if (message === '') {
    return Promise.resolve()
  }
  var self = this
  return self.messageHandler(message)
    .catch(function (err) {
      err = err.error || err
      var errMessage = 'Error sending message from MessageHandler: ' + err
      throw new Error(errMessage)
    })
}

/**
 * Called every bufferFlushInterval to flush any buffer that is around
 */
IntervalBuffer.prototype.onBufferFlushInterval = function () {
  var self = this
  return self.flushQueue()
}

/**
 * Close the underlying operation and stop listening for data on it.
 */
IntervalBuffer.prototype.close = function () {
  var self = this
  if (self.intervalHandle) {
    clearInterval(this.intervalHandle)
  }
  return self.flushQueue()
    .then(function () {
      if (self.closeHandler) {
        return self.closeHandler()
      }
    })
    .catch(function (err) {
      err = err.error || err
      var errMessage = 'Error closing the operation: ' + err
      throw new Error(errMessage)
    })
}

module.exports = IntervalBuffer
