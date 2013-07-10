storage-js
==========

Javascript library for handling localStorage, sessionStorage, and custom storage methods with a consistent, advanced, and flexible api. Comes predefined with support for local, session, and page-level storage. Great for working with nested objects. Allows storage of null, boolean, string, number, object, and array data.

	var session = storage("session");
	session.set(["person", "age"], 20);
	session.set(["person", "name"], { "first": "John", "last": "Doe" });
	session.set(["person", "name", "middle"], "Paul");
	session.get("person"); // Returns: { "name": { "first": "John", "last": "Doe", "middle": "Paul" }, "age": 20 }
	function addHobbies(hobby) {
		var key = ["person"];
		key.push(hobby);
		session.set(key, true);
	}
	addHobbies("Coding");
	addHobbies("Volleyball");
	addHobbies("Swimming");
	session.get(["person", "hobbies"]); // Returns: { "Coding": true, "Volleyball": true, "Swimming": true }
	session.get(["person", "nothing"]); // Returns undefined
	session.get(["person", "nothing"], "default"); // Returns "default"
