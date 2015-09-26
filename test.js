'use strict';

const nsjson = require('./ndjsonpoint.js');
const endpoint = require('endpoint');
const test = require('tap').test;

test('one normal chunk', function (t) {
  const s = nsjson();
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'b'}]);
    t.end();
  }));
  s.end('{"a":"b"}\n');
});

test('new lines are added to the tail', function (t) {
  const s = nsjson();
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'b'}]);
    t.end();
  }));
  s.end('{"a":"b"}');
});

test('empty NL lines are skiped', function (t) {
  const s = nsjson();
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'b'}]);
    t.end();
  }));
  s.end('{"a":"b"}\n\n');
});

test('empty CRNL lines are skiped', function (t) {
  const s = nsjson();
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'b'}]);
    t.end();
  }));
  s.end('{"a":"b"}\n\r\n');
});

test('json parse errors are catched', function (t) {
  const s = nsjson();
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.equal(err.name, 'SyntaxError');
    t.equal(err.message, 'Unexpected token }');
    t.end();
  }));
  s.end('{"a"}');
});

test('multiply json objects in one chunk', function (t) {
  const s = nsjson({ encoding: 'ascii' });
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    t.end();
  }));
  s.end('{"a":"a"}\n{"b":"b"}\n{"c":"c"}\n');
});

test('multiply json objects in multiply chunk', function (t) {
  const s = nsjson({ encoding: 'ascii' });
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    t.end();
  }));
  s.write('{"a":"a"}');
  s.write('\n');
  s.write('{"b":');
  s.write('"b"}\n')
  s.end('{"c":"c"}');
});

test('json object spread over multiply chunk', function (t) {
  const s = nsjson({ encoding: 'ascii' });
  s.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.ifError(err);
    t.deepEqual(data, [{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    t.end();
  }));
  s.write('{"a":"a"}\n{"b":');
  s.end('"b"}\n{"c":"c"}\n');
});
