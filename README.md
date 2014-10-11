storage-js
==========

[![Build Status](https://secure.travis-ci.org/username/storage-js.png?branch=master)](http://travis-ci.org/username/storage-js)

Javascript library for handling localStorage, sessionStorage, and custom storage methods with a consistent, advanced, and flexible api. Comes predefined with support for local, session, and page-level storage. Great for working with nested objects. Allows storage of null, boolean, string, number, object, and array data.

	var session = new Storage('session');
	session.set('person.age', 20);
	session.set('person.name', { 'first': 'John', 'last': 'Doe' });
	session.set('person.name.middle', 'Paul');
	session.get('person'); // Returns: { name: { first: 'John', last: 'Doe', middle: 'Paul' }, age: 20 }
	var hobbies = new Storage('session', 'person.hobbies');
	hobbies.set('Coding', true);
	hobbies.set('Volleyball', true);
	hobbies.set('Swimming', true);
	session.get('person.hobbies'); // Returns: { Coding: true, Volleyball: true, Swimming: true }
	session.get(['person', 'nothing']); // Returns undefined
