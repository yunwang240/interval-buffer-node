'use strict'

var Promise = require('bluebird')
var should = require('should')
var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var util = require('util')
var IntervalBuffer = require('../index.js')


function log(message) {
  // return function () {
    if (message.length > 0) {
      console.log('log function: ', message)
      return Promise.resolve({})
    }
    throw new Error('empty message')
  // }
}


describe('basic interval buffer functionalities', function () {
  var client

  beforeEach(function () {
    client = new IntervalBuffer({
      messageHandler: log,
      maxBufferSize: 126,
      bufferFlushInterval: 500
    })
  })

  it('test max buffer', function () {
    var message = 'test buffer for round %s '
    var messages = []
    for (var i = 0; i < 10; i++) {
      messages.push(util.format(message, i));
    }
    return Promise.each(messages, function(message) {
      return client.send(message)
        .then(function() {
          console.log('loop through %s', message);
        })
    })
      .then(function(){
        return client.close();
      })
  })

  it('test interval', function () {
    var message = 'test buffer for round %s '
    return client.send(util.format(message, 0))
      .then(function() {
        console.log('loop 0')
      })
      .delay(600)
      .then(function() {
        return client.send(util.format(message, 1))
      })
      // .delay(100)
      .then(function() {
        return client.send(util.format(message, 3))
      })
      .then(function() {
        console.log('loop 1')
      })
      .delay(500)
      .then(function() {
        console.log('loop 2')
      })
      .then(function() {
        return client.close();
      })

  })
})