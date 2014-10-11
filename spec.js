'use strict';
var assert  = require('assert'),
    Storage = require('./storage'),
    Promise = require('./bower_components/bluebird/js/browser/bluebird');

describe('storage-js', function() {
  var data, storage;
  
  it('can initialize with default medium', function() {
    var page = new Storage();
    assert.notStrictEqual(page, undefined);
  });
  it('can initialize with custom medium', function() {
    var noop = function(){},
        medium = { get:noop,all:noop,set:noop,remove:noop,clear:noop,decode:noop,encode:noop },
        custom = new Storage(medium);
    assert.notStrictEqual(custom, undefined);
  });
  it('can initialize with predefined medium', function() {
    var predefined = new Storage('local');
    assert.notStrictEqual(predefined, undefined);
  });
  it('can initialize without the new keyword', function() {
    var storage = Storage();
    assert.notStrictEqual(storage, undefined);
    assert.strictEqual(typeof storage.get, 'function');
  });
  it('can initialize with an empty object for the medium', function() {
    var storage = Storage({});
    assert.notStrictEqual(storage, undefined);
  });
  it('can initialize with a object of only string values for the medium', function() {
    var storage = Storage({key:'test',key2:'test2',key3:'test3'});
    assert.notStrictEqual(storage, undefined);
  });
  it('fails to initialize with an object that has non-string values', function() {
    assert.throws(function() {
      Storage({key:function(){}});
    });
  });
  
  function setupStorage(storage) {
    storage.set('person', { name: { first: 'John', last: 'Doe' } });
    storage.set('person.age', 42);
    storage.set('person.happy', true);
    storage.set('person.name.middle', 'X');
    storage.set('null', null);
  }

  function storageTests() {
    it('can store null', function() {
      assert.strictEqual(storage.get('null'), null);
    });
    it('can store a boolean', function() {
      assert.strictEqual(storage.get('person.happy'), true);
    });
    it('can store a number', function() {
      assert.strictEqual(storage.get('person').age, 42);
    });
    it('can store a string', function() {
      assert.strictEqual(storage.get('person.name.middle'), 'X');
    });
    it('can store an object', function() {
      assert.deepEqual(storage.get('person.name'), {first:'John',middle:'X',last:'Doe'});
    });
    it('can store using array notation', function() {
      storage.set(['an','array','key'], 'success');
      assert.strictEqual(storage.get('an.array.key'), 'success');
      storage.set('a.dot.key', 'success');
      assert.strictEqual(storage.get(['a','dot','key']), 'success');
      storage.set(['array.key.has.dots'], 'success');
      assert.strictEqual(storage.get(['array.key.has.dots']), 'success');
      assert.notStrictEqual(storage.get('array.key.has.dots'), 'success');
    });
    it('can work with nested objects', function() {
      assert.deepEqual(storage.get('person.name'), {first:'John',middle:'X',last:'Doe'});
    });
    it('returns undefined for nonexistant keys', function() {
      assert.strictEqual(storage.get('does.not.exist'), undefined);
      storage.set('does', 'exist');
      assert.strictEqual(storage.get(['does','not','exist']), undefined);
    });
    it('can remove a key', function() {
      assert.strictEqual(typeof storage.get('person'), 'object');
      storage.remove('person');
      assert.strictEqual(storage.get('person'), undefined);
    });
    it('can remove a complex key', function() {
      assert.strictEqual(storage.get('person.name.first'), 'John');
      storage.remove('person.name.first');
      assert.strictEqual(storage.get('person.name.first'), undefined);
    });
    it('can remove a key that has children', function() {
      assert.strictEqual(typeof storage.get('person.name'), 'object');
      storage.remove('person.name');
      assert.strictEqual(typeof storage.get('person'), 'object');
      assert.strictEqual(typeof storage.get('person.name'), 'undefined');
    });
    it('does not allow modification through a returned value', function() {
      var person = storage.get('person');
      person.age = 24;
      assert.strictEqual(storage.get('person.age'), 42);
      person.name.first = 'Jane';
      assert.strictEqual(storage.get('person.name.first'), 'John');
    });
    it('can iterate on all keys', function() {
      var all = storage.all();
      assert.strictEqual(all.person.name.first, 'John');
      assert.strictEqual(all['null'], null);
    });
    it('can clear the storage', function() {
      storage.clear();
      assert.deepEqual(storage.all(), {});
    });
    it('can create a subnamespace with shared storage', function() {
      var person = storage.createNamespace('person');
      person.set('name.first', 'Jane');
      assert.strictEqual(person.get('name.first'), 'Jane');
      assert.strictEqual(storage.get('person.name.first'), 'Jane');
      person.set('null', 'notnull');
      assert.strictEqual(storage.get('null'), null);
    });
  };
  
  describe('page storage', function() {
    beforeEach(function() {
      storage = new Storage('page');
      setupStorage(storage);
    });
    storageTests();
  });
  
  describe('namespaced storage', function() {
    beforeEach(function() {
      storage = new Storage('page', 'my.namespace');
      setupStorage(storage);
    });
    storageTests();
  });
  
  describe('async storage', function() {
    this.timeout(2000);
    
    function next(callback) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve(callback());
        }, 1);
      });
    }
    
    function then(fn) {
      return {
        then: function(callback) {
          next(callback);
        }
      };
    }
    
    beforeEach(function() {
      var key;
      data = {
        person: {
          age: 42,
          happy: true,
          name: {
            first: 'John',
            middle: 'X',
            last: 'Doe'
          }
        },
        'null': null
      };
      for ( key in data ) {
        data[key] = JSON.stringify(data[key]);
      }
      storage = new Storage({
        get: function(key) {
          return next(function() {
            return data[key];
          });
          //return Promise.resolve(data[key]);
        },
        all: function() {
          return next(function() {
            return data;
          });
        },
        set: function(key, value) {
          return next(function() {
            data[key] = value;
          });
        },
        remove: function(key) {
          return next(function() {
            delete data[key];
          });
        },
        clear: function(key) {
          return next(function() {
            data = {};
          });
        },
        decode: JSON.parse,
        encode: JSON.stringify
      });
    });
    
    it('can store null', function() {
      return storage.get('null').then(function(value) {
        assert.strictEqual(value, null);
      });
    });
    it('can store a boolean', function() {
      return storage.get('person.happy').then(function(value) {
        assert.strictEqual(value, true);
      });
    });
    it('can store a number', function() {
      return storage.get('person').then(function(value) {
        assert.strictEqual(value.age, 42);
      });
    });
    it('can store a string', function() {
      return storage.get('person.name.middle').then(function(value) {
        assert.strictEqual(value, 'X');
      });
    });
    it('can store an object', function() {
      return storage.get('person.name').then(function(value) {
        assert.deepEqual(value, {first:'John',middle:'X',last:'Doe'});
      });
    });
    it('can store using array notation', function() {
      return storage.set(['an','array','key'], 'success').then(function() {
        return storage.get('an.array.key').then(function(value) {
          assert.strictEqual(value, 'success');
          return storage.set('a.dot.key', 'success').then(function() {
            return storage.get(['a','dot','key']).then(function(value) {
              assert.strictEqual(value, 'success');
              return storage.set(['array.key.has.dots'], 'success').then(function() {
                return storage.get(['array.key.has.dots']).then(function(value) {
                  assert.strictEqual(value, 'success');
                  return storage.get('array.key.has.dots').then(function(value) {
                    assert.notStrictEqual(value, 'success');
                  });
                });
              });
            });
          });
        });
      });
    });
    it('can work with nested objects', function() {
      return storage.get('person.name').then(function(value) {
        assert.deepEqual(value, {first:'John',middle:'X',last:'Doe'});
      });
    });
    it('returns undefined for nonexistant keys', function() {
      return storage.get('does.not.exist').then(function(value) {
        assert.strictEqual(value, undefined);
        return storage.set('does', 'exist').then(function() {
          return storage.get(['does','not','exist']).then(function(value) {
            assert.strictEqual(value, undefined);
          });
        });
      });
    });
    it('can remove a key', function() {
      return storage.get('person').then(function(value) {
        assert.strictEqual(typeof value, 'object');
        return storage.remove('person').then(function() {
          return storage.get('person').then(function(value) {
            assert.strictEqual(value, undefined);
          });
        });
      });
    });
    it('can remove a complex key', function() {
      return storage.get('person.name.first').then(function(value) {
        assert.strictEqual(value, 'John');
        return storage.remove('person.name.first').then(function() {
          return storage.get('person.name.first').then(function(value) {
            assert.strictEqual(value, undefined);
          });
        });
      });
    });
    it('can remove a key that has children', function() {
      return storage.get('person.name').then(function(value) {
        assert.strictEqual(typeof value, 'object');
        return storage.remove('person.name').then(function() {
          return storage.get('person').then(function(value) {
            assert.strictEqual(typeof value, 'object');
            return storage.get('person.name').then(function(value) {
              assert.strictEqual(typeof value, 'undefined');
            });
          });
        });
      });
    });
    it('does not allow modification through a returned value', function() {
      return storage.get('person').then(function(person) {
        person.age = 24;
        return storage.get('person.age').then(function(value) {
          assert.strictEqual(value, 42);
          person.name.first = 'Jane';
          return storage.get('person.name.first').then(function(value) {
            assert.strictEqual(value, 'John');
          });
        });
      });
    });
    it('can iterate on all keys', function() {
      return storage.all().then(function(all) {
        assert.strictEqual(all.person.name.first, 'John');
        assert.strictEqual(all['null'], null);
      });
    });
    it('can clear the storage', function() {
      return storage.clear().then(function() {
        return storage.all().then(function(value) {
          assert.deepEqual(value, {});
        });
      });
    });
  });
});
