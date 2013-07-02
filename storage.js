(function(window, document, undefined) {
	
	var useLogging = false,
		// the karma log is ugly and inaccurate, make some adjustments if it's detected...
		karmifyLog = function() {
			var args, i, l;
			args = Array.prototype.slice.call(arguments, 0);
			if ( document.location.href.indexOf("localhost:9876") >= 0 ) {
				for ( i = 0, l = args.length; i < l; i++ ) {
					// karma reports undefined the same as null, fix that
					if ( args[i] === undefined ) {
						args[i] = "!undefined!";
					}
					// also convert null to string to match
					if ( args[i] === null ) {
						args[i] = "!null!";
					}
					// append strings so they flow on one line
					if ( i > 0 ) {
						if ( typeof args[i] === "string" && typeof args[i-1] === "string" ) {
							args[i-1] = args[i-1]+" "+args[i];
							args.splice(i,1);
							i--;
							l--;
						}
					}
				}
			}
			return args;
		},
		error = function() {
			if ( window.console ) {
				console.error.apply(console, karmifyLog.apply(this, arguments));
			}
		},
		// The log function
		log = function() {
			if ( window.console && useLogging ) {
				console.log.apply(console, karmifyLog.apply(this, arguments));
			}
		},
		// The library function, which can be used to call its methods, most primarily used to call the init method
		storage = function(method) {
			if ( storage[method] ) {
				return storage[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else {
				return storage.init.apply(this, arguments);
			}
		},
		// Checks if the given value is an array
		isArray = function(val) {
			return typeof val === "object" && val.length;
		},
		// Checks if the value can be a valid key
		isKey = function(val) {
			return isKeySimple(val) || isKeyArray(val);
		},
		// Checks if the given value is an arry of valid keys
		isKeyArray = function(val) {
			var i,l;
			if ( !isArray(val) ) {
				return false;
			}
			for ( i = 0, l = val.length; i < l; i++ ) {
				if ( typeof val[i] !== "string" ) {
					return false;
				}
			}
			return true;
		},
		isKeySimple = function(val) {
			return typeof val === "string";
		},
		// Turns the given value into an array
		makeArray = function(val) {
			return isArray(val) ? val : [val];
		},
		isSupportedValue = function(val) {
			return typeof val !== "function";
		},
		isKeyValueObject = function(val) {
			return typeof val === "object" && !isArray(val);
		},
		// The base function for all instances of storage, handles short-hand calls for common functionality
		base = function(key, value) {
			switch ( arguments.length ) {
				case 0:
					return this.get();
					break;
				case 1:
					if ( isKeyValueObject(key) ) {
						return this.set(key, value);
					}
					return this.get(key);
					break;
				default:
					return this.set(key, value);
					break;
			}
		},
		// Returns a value for a storage medium
		// get(key) returns the value at key, or undefined if it does not exist
		// get(key,default) returns value at key, or default it it does not exist
		// get([list,of,keys]) assumes the value at key 'list' is an object and digs through
		//   its key/object pairs to return the value at 'keys' -- if any key is not an object,
		//   then undefined is returned because it can't find the final key
		// get() returns an object representing the whole set of data
		get = function(key, defaultValue) {
			var rawValue, decodedValue, returnValue;
			if ( key === undefined ) {
				return all.call(this, defaultValue);
			} else if ( isKey(key) ) {
				key = makeArray(key);
				rawValue = this.storage.get(key[0]);
				if ( rawValue !== undefined ) {
					try {
						decodedValue = this.storage.decode(rawValue);
					} catch (e) {
						log("Error occured decoding value stored at",key);
					}
				}
				decodedValue = traverseObject(decodedValue, key.slice(1)); // all keys after the first
				returnValue = decodedValue === undefined ? defaultValue : decodedValue;
				log("Got",key,"as",rawValue,"decoded as",decodedValue,"default",defaultValue,"returning",returnValue);
				return returnValue;
			} else {
				error("storage.get(key,default) key must be one of undefined, string, or array of strings, got",k);
			}
		},
		// Sets a value in a storage medium
		// set(key, value) sets a simple string key to the given value, where value can be a string, a number, null,
		//   an object, or an array (does not support functions)
		// set(key) or set(key, undefined) removes the key from the storage medium (prefer to use the clear method)
		// set([list,of,keys], value) assumes the value at key 'list' is an object and digs through
		//   its key/object pairs to ultimately set the value of 'keys' to the given value -- if any
		//   key is not an object, it will be turned into an object
		// set({}) overwrites the entire storage medium with the given object
		set = function(key, value) {
			var encodedValue;
			if ( isKeyValueObject(key) ) {
				this.clear();
				value = key;
				for ( key in value ) {
					this.set(key, value[key]);
				}
			} else if ( isKey(key) ) {
				if ( value === undefined ) {
					log("storage.set passing control to storage.clear");
					return this.clear(key);
				}
				
				if ( isSupportedValue(value) ) {
					key = makeArray(key);
					if ( key.length <= 1 ) {
						encodedValue = this.storage.encode(value);
					} else {
						// get the object at the root key, traverse it to the given key, set the value, encode
						encodedValue = this.storage.encode(traverseObject(this.get(key[0]), key.slice(1), value));
					}
					this.storage.set(key[0], encodedValue);
					log("Set",key,"as",value,"encoded as",encodedValue);
				} else {
					error("storage.set(key,value) value cannot be a function");
				}
			} else {
				error("storage.set(key,value) key must be one of string, array of strings, or object, got",k);
			}
			return this;
		},
		// Removes keys from the storage medium
		// clear(k) will remove just the given key
		// clear([list,of,keys]) assumes the value at key 'list' is an object and digs through
		//   its key/object pairs until it reaches the key 'keys' then removes that from the
		//   'list' object -- if any key is not an object, it will be turned into an object
		// clear() will remove every key from the storage medium
		clear = function(key) {
			if ( isKey(key) ) {
				key = makeArray(key);
				if ( key.length == 1 ) {
					this.storage.remove(key);
				} else {
					traverseObject(this.get(key[0]), key.slice(1), undefined);
				}
				log("Cleared", key);
			} else if ( key === undefined ) {
				this.storage.clear();
				log("Cleared all");
			} else {
				error("storage.clear(key) key must be one of undefined, string, or array of strings, got",key);
			}
			return this;
		},
		// Handles traversing the key/object pairs for all functions that can take an array list of keys
		traverseObject = function(object, key, value) {
			if ( !key.length ) {
				return object;
			}
			var keys = key.slice(0), // create copy so as not to destroy the original
				current = object,
				vGiven = arguments.length > 2,
				i, l;
			if ( typeof current !== "object" ) {
				object = current = {};
			}
			while ( keys.length ) {
				key = keys.splice(0,1)[0]; // remove keys[0] and assign to key
				if ( keys.length ) {
					if ( !isKeyValueObject(current[key]) ) {
						current[key] = {};
					}
				} else if ( vGiven ) {
					current[key] = value;
				}
				current = current[key];
			}
			return vGiven ? object : current;
		},
		// Returns an object representing the whole set of data
		all = function(defaultValue) {
			var allValues = this.storage.all(),
				isEmpty = true,
				k;
			for ( k in allValues ) {
				if ( allValues.hasOwnProperty(k) ) {
					try {
						allValues[k] = this.storage.decode(allValues[k]);
						isEmpty = false;
					} catch(e) {
						log("Error occured decoding value stored at",k);
						delete allValues[k];
					}
				}
			}
			log("Got all values as",allValues);
			return isEmpty ? defaultValue || [] : allValues;
		},
		// List of predefinde mediums that come with the storage library
		// The functions of the medium should be as sparse as possible, only doing simple gets and sets
		// The methods of the storage object handle all the transformations and traversals and other features
		mediums = {
			"local": window.localStorage ? {
				"get": function(k) {
					var value = localStorage.getItem(k);
					return typeof value === "string" ? value : undefined;
				},
				"all": function() {
					var all = {};
					for ( k in localStorage ) {
						if ( localStorage.hasOwnProperty(k) ) {
							all[k] = localStorage[k];
						}
					}
					return all;
				},
				"set": function(k, v) {
					localStorage.setItem(k, v);
				},
				"remove": function(k) {
					localStorage.removeItem(k);
				},
				"clear": function() {
					localStorage.clear();
				},
				"decode": function(v) {
					return storage.decodeJSON(v);
				},
				"encode": function(v) {
					return storage.encodeJSON(v);
				}
			} : {
				"get": function(k) {
					
				},
				"set": function(k, v) {
					
				}
			},
			"session": window.sessionStorage ? {
				"get": function(k) {
					var value = sessionStorage.getItem(k);
					return typeof value === "string" ? value : undefined;
				},
				"all": function() {
					var all = {};
					for ( k in sessionStorage ) {
						if ( sessionStorage.hasOwnProperty(k) ) {
							all[k] = sessionStorage[k];
						}
					}
					return all;
				},
				"set": function(k, v) {
					sessionStorage.setItem(k, v);
				},
				"remove": function(k) {
					sessionStorage.removeItem(k);
				},
				"clear": function() {
					sessionStorage.clear();
				},
				"decode": function(v) {
					return storage.decodeJSON(v);
				},
				"encode": function(v) {
					return storage.encodeJSON(v);
				}
			} : {
				"get": function(k) {
					
				},
				"set": function(k, v) {
					
				}
			},
			"page": (function() {
				var data = {},
					// reserve fresh copy so the key can be overwritten later without breaking function
					hasOwnProperty = data.hasOwnProperty;
				return {
					"get": function(k) {
						var has = hasOwnProperty.call(data, k);
						return has ? data[k] : undefined;
					},
					"all": function() {
						var all = {};
						for ( k in data ) {
							if ( hasOwnProperty.call(data, k) ) {
								all[k] = data[k];
							}
						}
						return all;
					},
					"set": function(k, v) {
						data[k] = v;
					},
					"remove": function(k) {
						delete data[k];
					},
					"clear": function() {
						for ( k in data ) {
							if ( hasOwnProperty.call(data, k) ) {
								delete data[k];
							}
						}
					},
					"decode": function(v) {
						return v;
					},
					"encode": function(v) {
						return v;
					}
				};
			})()
		};
	
	mediums.default = mediums.session;
	
	// The init function initializes a new storage medium
	// storage("string") will attempt to initialize using a predefined medium from the mediums list
	// storage({}) will attempt to initialize using the given object medium, which should define all the functions
	//   defined by the predefined mediums in the mediums list
	// storage() will initialize the default medium
	storage.init = function(medium) {
		var newStorage;
		newStorage = function() {
			return base.apply(newStorage, arguments);
		};
		newStorage.get = get;
		newStorage.set = set;
		newStorage.clear = clear;
		newStorage.storage = {};
		if ( typeof medium === "string" ) {
			medium = mediums[medium];
		}
		if ( !medium ) {
			medium = mediums.default;
		}
		for ( k in medium ) {
			newStorage.storage[k] = medium[k] || mediums.default[k];
		}
		return newStorage;
	};
	
	// Will encode the given value as json
	storage.encodeJSON = function(value) {
		if ( !JSON || !JSON.stringify ) {
			throw "storage.encodeJSON : JSON.stringify is not supported on this browser";
		}
		return JSON.stringify(value);
	};
	
	// Will decode the given json and return a value representing it
	storage.decodeJSON = function(json) {
		if ( !JSON || !JSON.parse ) {
			throw "storage.decodeJSON : JSON.parse is not supported on this browser";
		}
		return JSON.parse(json);
	};
	
	// Call this function to enable logging (should be called from test files and in test environments)
	storage.enableLogging = function() {
		useLogging = true;
	}
	
	// Call this function to disable logging (off by default)
	storage.disableLogging = function() {
		useLogging = false;
	}
	
	// Allow outside use of some of the helper functions
	storage.isArray          = isArray;
	storage.isKey            = isKey;
	storage.isKeyArray       = isKeyArray;
	storage.isKeySimple      = isKeySimple;
	storage.makeArray        = makeArray;
	storage.isKeyValueObject = isKeyValueObject;
	storage.log              = log;
	storage.error            = error;
	
	// Assign the global reference
	if ( !window.storage ) {
		window.storage = storage;
	}
	
})(window, document);