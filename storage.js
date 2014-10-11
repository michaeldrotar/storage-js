'use strict';
;(function(root,lib) {
  if ( typeof define === 'function' && define.amd ) {
    define([], lib);
  } else if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = lib();
  } else {
    root.Storage = lib();
  }
})(this, function() {
  /* ***************************************************************************
  VIRTUAL CLASSES
  The following classes are documented for clarity but are not explicitly
  defined by the library.
  *************************************************************************** */
  /**
    Stores the data used by the Storage class.
    May be implemented as any object that has the given method signatures and
    can store string data, such as localStorage and sessionStorage.
    
    @class StorageMedium
  */
  /**
    Retrieves the content at the given key.
    
    @method get
    @param {String} key
    @return {String}
  */
  /**
    Retrieves all of the key/value pairs.
    Must create a copy so that modifying the returned object does not also
      modify the stored values.
    
    @method all
    @return {Object}
  */
  /**
    Stores the given content at the given key.
    
    @method set
    @param {String} key
    @param {String} value
  */
  /**
    Removes the given key from storage.
    
    @method remove
    @param {String} key
  */
  /**
    Removes all key/value pairs from storage.
    
    @method clear
  */
  /**
    Decodes a value from a String to an Object.
    Typically set to JSON.parse.
    
    @method decode
    @param {String} value
    @return {Object}
  */
  /**
    Encodes a value from an Object to a String.
    Typically set to JSON.stringify.
    
    @method encode
    @param {Object} value
    @return {String}
  */
  
  /**
    Defines a key for storage.
    Keys are typically provided as a String with dot notation, for example:
      person.name.first.
    Alternatively, keys may be defined as an array of Strings where each item
      of the array traverses down the structure. This format allows a single
      key to have a dot in its name.
    
    @class StorageKey
  */
  
  /**
    Defines a value for storage.
    A value can be any of the following types: null, boolean, number, string,
      object.
    Values cannot be functions. Any functions on an object will be lost.
    Values cannot be undefined.
    
    @class StorageValue
  */
  
  /* ***************************************************************************
  MAIN
  *************************************************************************** */
  var root = this,
      mediums = {},
      Storage;
  
  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }
  
  function forEach(obj, callback) {
    var key, length, ret;
    if ( isArray(obj) ) {
      for ( key = 0, length = obj.length; key < length; key++ ) {
        callback(obj[key], key, obj);
      }
    } else {
      for ( key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
          ret = callback(obj[key], key, obj);
          if ( ret !== undefined ) {
            return ret;
          }
        }
      }
    }
  }
  
  function getkeys(key) {
    if ( !key ) return [];
    return typeof key === 'string' ? key.split(/\./g) : key.slice(0);
  };
  
  function getkeystring(key) {
    return typeof key === 'string' ? key : key.join('.');
  };
  
  var hasOwnProperty = ({}).hasOwnProperty;
  
  function createMediumFromObject(data) {
    var hasOwnProperty = ({}).hasOwnProperty;
    return {
      get: function(key) {
        var has = hasOwnProperty.call(data, key);
        return has ? data[key] : undefined;
      },
      all: function() {
        var all = {},
            key;
        for ( key in data ) {
          if ( hasOwnProperty.call(data, key) ) {
            all[key] = data[key];
          }
        }
        return all;
      },
      set: function(key, value) {
        data[key] = value.toString();
      },
      remove: function(key) {
        delete data[key];
      },
      clear: function() {
        var key;
        for ( key in data ) {
          if ( hasOwnProperty.call(data, key) ) {
            delete data[key];
          }
        }
      },
      decode: JSON.parse,
      encode: JSON.stringify
    };
  }
  
  mediums.page = createMediumFromObject({});
  
  forEach({'local':'localStorage','session':'sessionStorage'}, function(storageName, mediumName) {
    var storage = root && root[storageName];
    mediums[mediumName] = storage ? {
      get: function(key) {
        var value = storage.getItem(key);
        return typeof value === 'string' ? value : undefined;
      },
      all: function() {
        var all = {},
            i,
            l,
            key;
        for ( i = 0, l = storage.length; i < l; i++ ) {
          key = storage.key(i);
          all[key] = storage.getItem(key);
        }
        return all;
      },
      set: function(key, value) {
        storage.setItem(key, value);
      },
      remove: function(key) {
        storage.removeItem(key);
      },
      clear: function() {
        storage.clear();
      },
      decode: JSON.parse,
      encode: JSON.stringify
    } : mediums.page;
  });
  
  function createMedium(obj) {
    var isMedium = true,
        isStrings = true;
    if ( !obj ) {
      return createMediumFromObject({});
    } else if ( typeof obj === 'string' ) {
      if ( mediums.hasOwnProperty(obj) ) {
        return mediums[obj];
      }
    } else {
      forEach(mediums.page, function(_, key) {
        var type = typeof obj[key];
        // To be a medium, must have all the medium functions
        // encode and decode are optional and may be undefined
        if ( type !== 'function' ) {
          if ( (key !== 'encode' && key !== 'decode') || type === 'undefined' ) {
            isMedium = false;
          }
        }
      });
      if ( isMedium ) {
        // default encode and decode
        obj.encode = obj.encode || JSON.stringify;
        obj.decode = obj.decode || JSON.parse;
        return obj;
      }
      forEach(obj, function(value, key) {
        var type = typeof value;
        if ( type !== 'string' ) {
          isStrings = false;
        }
      });
      if ( isStrings ) {
        return createMediumFromObject(obj);
      }
    }
    throw new Error('Storage(medium, namespace) : medium must be the name of a predefined medium, an object that implements the StorageMedium interface, or an object that has only string values');
  };
  
  /**
    Provides advanced functionality for working with storage mediums.
    
    @class Storage
    @constructor
    @param {StorageMedium} [medium]
    @param {String} [namespace]
    @return {Storage}
  */
  Storage = function(medium, namespace) {
    var data;
    if ( this === root ) {
      return new Storage(medium, namespace);
    }
    
    medium = createMedium(medium);
    namespace = getkeys(namespace);
    
    function addNamespace(key) {
      key = getkeys(key);
      return namespace ? namespace.concat(key) : key;
    }
    
    /**
      Retrieves a value from Storage.
      
      @method get
      @param {StorageKey} key
      @return {StorageValue}
    */
    this.get = function(key) {
      //return Storage.get(medium, addNamespace(key));
      return get(medium, addNamespace(key));
    };
    
    /**
      Retrieves a collection of all key/value pairs that are in Storage.
      
      @method all
      @return {Object}
    */
    this.all = function() {
      //return namespace.length ? Storage.get(medium, namespace) : Storage.all(medium);
      return namespace.length ? get(medium, namespace) : all(medium);
    };
    
    /**
      Stores a given value into the given medium using the given key.
      
      @static
      @method set
      @param {StorageMedium} medium
      @param {StorageKey} key
      @param {StorageValue} value
    */
    this.set = function(key, value) {
      //Storage.set(medium, addNamespace(key), value);
      return set(medium, addNamespace(key), value);
    };
    
    /**
      Removes a given key from Storage.
      
      @method remove
      @param {StorageKey} key
    */
    this.remove = function(key) {
      //Storage.remove(medium, addNamespace(key));
      return remove(medium, addNamespace(key));
    };
    
    /**
      Clears everything from the storage medium.
      
      @method clear
    */
    this.clear = function() {
      if ( namespace.length ) {
        //Storage.set(medium, namespace, {});
        return set(medium, namespace, {});
      } else {
        //Storage.clear(medium);
        return clear(medium);
      }
    };
    
    /**
      Returns a new Storage object that uses the same storage medium
      as this storage object but is namespaced into the given namespace.
      
      @method createNamespace
      @param {String} namespace
      @return {Storage}
      @example
          var myapp = new Storage('local', 'myapp'),
              config = myapp.createNamespace('config');
          // set localStorage.myapp.config.stuffEnabled = true
          config.set('stuffEnabled', true);
    */
    this.createNamespace = function(ns) {
      var newNamespace = namespace.slice(0);
      newNamespace.push(ns);
      return new Storage(medium, newNamespace);
    }
    
    return this;
  };
  
  function _get(medium, firstkey, keys, value) {
    var lastkey = keys.pop(),
        i,
        l;
    if ( !value ) {
      return undefined;
    }
    try {
      value = medium.decode(value);
    } catch ( e ) {
      throw new Error('Failed to parse value stored at '+key);
    }
    for ( i = 0, l = keys.length; i < l; i++ ) {
      if ( typeof value[keys[i]] === 'object' ) {
        value = value[keys[i]];
      } else {
        return undefined;
      }
    }
    if ( lastkey ) {
      return value[lastkey];
    }
    return value;
  }
  
  function get(medium, key) {
    var keys = getkeys(key),
        firstkey = keys.shift(),
        value = medium.get(firstkey);
    return value && value.then ? value.then(function(value) {
      return _get(medium, firstkey, keys, value);
    }) : _get(medium, firstkey, keys, value);
  }
  
  function _all(medium, obj) {
    var copy = {};
    forEach(obj, function(value, key) {
      copy[key] = medium.decode(value);
    });
    return copy;
  }
  
  function all(medium) {
    var obj = medium.all();
    return obj && obj.then ? obj.then(function(obj) {
      return _all(medium, obj);
    }) : _all(medium, obj);
  }
  
  function _set(medium, firstkey, keys, original, value) {
    var lastkey = keys.pop(),
        current = original,
        i;
    if ( lastkey && !original ) {
      original = current = {};
    }
    for ( i = 0; i < keys.length; i++ ) {
      if ( typeof current[keys[i]] !== 'object' ) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    if ( lastkey ) {
      current[lastkey] = value;
    } else {
      original = current = value;
    }
    try {
      return medium.set(firstkey, medium.encode(original));
    } catch ( e ) {
      throw new Error('Failed to store value at '+key);
    }
  }
  
  function set(medium, key, value) {
    var keys = getkeys(key),
        firstkey = keys.shift(),
        original = get(medium, firstkey);
    return original && original.then ? original.then(function(original) {
      return _set(medium, firstkey, keys, original, value);
    }) : _set(medium, firstkey, keys, original, value);
  }
  
  function _remove(medium, firstkey, keys, original) {
    var lastkey = keys.pop(),
        current = original,
        i;
    if ( !original ) {
      return;
    }
    for ( i = 0; i < keys.length; i++ ) {
      if ( typeof current[keys[i]] !== 'object' ) {
        return;
      }
      current = current[keys[i]];
    }
    if ( lastkey ) {
      delete current[lastkey];
      try {
        return medium.set(firstkey, medium.encode(original));
      } catch ( e ) {
        throw new Error('Failed to remove key at '+key);
      }
    }
    return medium.remove(firstkey);
  }
  
  function remove(medium, key) {
    var keys = getkeys(key),
        firstkey = keys.shift(),
        original = get(medium, firstkey);
    return original && original.then ? original.then(function(original) {
      return _remove(medium, firstkey, keys, original);
    }) : _remove(medium, firstkey, keys, original);
  }
  
  function clear(medium) {
    return medium.clear();
  }
  
  return Storage;
});