'use strict';

const stream = require('stream');
const util = require('util');

const EMPTY_BUFFER = new Buffer(0);
const NEWLINE_BUFFER = new Buffer('\n');
const NL_CHAR_CODE = '\n'.charCodeAt(0);
const CR_CHAR_CODE = '\r'.charCodeAt(0);

function NdjsonPoint(options) {
  if (!(this instanceof NdjsonPoint)) return new NdjsonPoint(options);
  options = options || {};

  stream.Transform.call(this, {
    writableObjectMode: false,
    readableObjectMode: true,
    highWaterMark: options.highWaterMark
  });

  this._encoding = options.encoding || 'utf8';
  this._buffer = EMPTY_BUFFER;
}
util.inherits(NdjsonPoint, stream.Transform);
module.exports = NdjsonPoint;

NdjsonPoint.prototype._parseJSON = function (data, start, end) {
  const length = end - start;
  if (length === 0) return null;
  if (length === 1 && data[start] === CR_CHAR_CODE) return null;

  try {
    this.push(
      JSON.parse(data.toString(this._encoding, start, end))
    );
  } catch (e) {
    return e;
  }

  return null;
}

NdjsonPoint.prototype._transform = function (data, encoding, done) {
  // Join with the buffer, if any data exists in it
  if (this._buffer.length) {
    data = Buffer.concat([this._buffer, data]);
  }

  let offset = 0, index;
  while (true) {
    index = data.indexOf(NL_CHAR_CODE, offset);

    // There are no more newlines, stop searching
    if (index === -1) break;

    // Attempt to parse the string
    const error = this._parseJSON(data, offset, index);
    if (error) return done(error);

    // Next search starts after index
    offset = index + 1;

    // If there is no more data, stop
    if (offset == data.length) break;
  }

  // Update buffer, if any data exists
  if (offset < data.length) {
    this._buffer = data.slice(offset);
  } else {
    this._buffer = EMPTY_BUFFER;
  }

  done(null);
};

NdjsonPoint.prototype._flush = function (done) {
  if (this._buffer.length > 0) {
    this._transform(NEWLINE_BUFFER, 'buffer', done);
  } else {
    done(null);
  }
};
