describe("storage-js", function() {
	// Called for each type of storage
	function testStorage(name, storage) {
		describe(name, function() {
			describe("set", function() {
				it("works with strings", function() {
					storage.set("string", "string");
					expect(storage.get("string")).toBe("string");
				});
				it("works with empty string", function() {
					storage.set("empty", "");
					expect(storage.get("empty")).toBe("");
				});
				it("works with numbers", function() {
					storage.set("number", 1);
					expect(storage.get("number")).toBe(1);
				});
				it("works with true", function() {
					storage.set("true", true);
					expect(storage.get("true")).toBe(true);
				});
				it("works with false", function() {
					storage.set("false", false);
					expect(storage.get("false")).toBe(false);
				});
				it("works with null", function() {
					storage.set("null", null);
					expect(storage.get("null")).toBe(null);
				});
				it("works with objects", function() {
					storage.set("object", {"key":"value"});
					expect(storage.get("object")).toEqual({"key":"value"});
				});
				it("works with arrays", function() {
					storage.set("array", [1,2,3]);
					expect(storage.get("array")).toEqual([1,2,3]);
				});
			});
			describe("clear", function() {
				it("works on single keys", function() {
					storage.clear("string");
					expect(storage.get("string")).toBeUndefined();
					expect(storage.get("number")).toBeDefined();
				});
				it("works called from set with undefined value", function() {
					storage.set("number", undefined);
					expect(storage.get("number")).toBeUndefined();
					expect(storage.get("null")).toBeDefined();
				});
				it("works on the whole data set", function() {
					storage.clear();
					expect(storage.get("null")).toBeUndefined();
					expect(storage.get("object")).toBeUndefined();
					expect(storage.get("array")).toBeUndefined();
				});
				it("leaves it empty", function() {
					expect(storage()).toEqual({});
				});
			});
			describe("complex keys", function() {
				it("can be set starting from an undefined key", function() {
					storage.set(["object","key"], "value");
					expect(storage.get("object")).toEqual({"key":"value"});
				});
				it("can be set starting from a defined key", function() {
					storage.set(["object","key2"], "value2");
					expect(storage.get("object")).toEqual({"key":"value","key2":"value2"});
				});
				it("can go really deep", function() {
					storage.set(["deepobject","key1","key2","key3","key4","key5"], "value");
					expect(storage.get("deepobject")).toEqual({"key1":{"key2":{"key3":{"key4":{"key5":"value"}}}}});
				});
				it("can overwrite the whole storage medium", function() {
					storage.set({"overwrite":"done"});
					expect(storage.get()).toEqual({"overwrite":"done"});
				});
			});
			describe("base function", function() {
				it("can set a value", function() {
					storage("basekey", "value");
					expect(storage("basekey")).toBe("value");
				});
				it("can get all values", function() {
					expect(typeof storage()).toBe("object");
				});
			});
			describe("special keys", function() {
				it("can work with getItem", function() {
					storage.set("getItem", "getItem");
					expect(storage.get("getItem")).toBe("getItem");
				});
				it("can work with setItem", function() {
					storage.set("setItem", "setItem");
					expect(storage.get("setItem")).toBe("setItem");
				});
				it("can work with removeItem", function() {
					storage.set("removeItem", "removeItem");
					expect(storage.get("removeItem")).toBe("removeItem");
				});
				it("can work with length", function() {
					storage.set("length", "length");
					expect(storage.get("length")).toBe("length");
				});
				it("can work with key", function() {
					storage.set("key", "key");
					expect(storage.get("key")).toBe("key");
				});
				it("can work with clear", function() {
					storage.set("clear", "clear");
					expect(storage.get("clear")).toBe("clear");
				});
				it("can work with hasOwnProperty", function() {
					storage.set("hasOwnProperty", "hasOwnProperty");
					expect(storage.get("hasOwnProperty")).toBe("hasOwnProperty");
				});
			})
		});
	}
	
	it("does exist", function() {
		expect(typeof window.storage).toBe("function");
	});
	it("can encode json", function() {
		expect(storage.encodeJSON(undefined)).toBe(undefined);
		expect(storage.encodeJSON(null)).toBe("null");
		expect(storage.encodeJSON(1)).toBe("1");
		expect(storage.encodeJSON("s")).toBe("\"s\"");
		expect(storage.encodeJSON({})).toBe("{}");
		expect(storage.encodeJSON([])).toBe("[]");
		expect(storage.encodeJSON({
			number:1,
			string:"s",
			"undefined":undefined,
			"null":null,
			"array":[1,2,3],
			"object":{"sub-array":[4,5,6]}
		})).toBe("{"+
			"\"number\":1,"+
			"\"string\":\"s\","+
			"\"null\":null,"+
			"\"array\":[1,2,3],"+
			"\"object\":{\"sub-array\":[4,5,6]}"+
		"}");
	});
	it("can decode json", function() {
		expect(function() { storage.decodeJSON("undefined") }).toThrow();
		expect(storage.decodeJSON("null")).toBe(null);
		expect(storage.decodeJSON("1")).toBe(1);
		expect(storage.decodeJSON("\"s\"")).toBe("s");
		expect(storage.decodeJSON("{}")).toEqual({});
		expect(storage.decodeJSON("[]")).toEqual([]);
		expect(storage.decodeJSON("{"+
			"\"number\":1,"+
			"\"string\":\"s\","+
			"\"null\":null,"+
			"\"array\":[1,2,3],"+
			"\"object\":{\"sub-array\":[4,5,6]}"+
		"}")).toEqual({
			number:1,
			string:"s",
			"undefined":undefined,
			"null":null,
			"array":[1,2,3],
			"object":{"sub-array":[4,5,6]}
		});
	});
	it("can initialize session storage by default", function() {
		var session = storage("session");
		expect(typeof session).toBe("function");
	});
	it("can initialize local storage by default", function() {
		var local = storage("local");
		expect(typeof local).toBe("function");
	});
	it("can initialize page storage", function() {
		var page = storage("page");
		expect(typeof page).toBe("function");
	});
	it("fails to initialize on a storage name that doesn't exist", function() {
		expect(storage("blah")).toBeUndefined();
	});
	it("fails to initialize on a storage method that doesn't define all functions", function() {
		expect(storage({"get":function(){}})).toBeUndefined();
	});
	it("fails to initialize if no storage method is passed", function() {
		expect(storage()).toBeUndefined();
	});
	
	testStorage("session", storage("session"));
	testStorage("local", storage("local"));
	testStorage("page", storage("page"));
});