'use strict';

let search_string = '';
let selectorOffset = 0;
let screenFocus = 'base';
let currentForm = null;
let blessed = require('blessed');
let hypernodeBrancher = require('./hypernode-brancher');

/**
 * @module listeners
 */

/**
 * Gets the current search string
 * @return string
 */
exports.getSearchString = function() {
	return search_string;
};

/**
 * Gets which index in the list is currently selected
 */
exports.getSelectorOffset = function() {
	return selectorOffset;
}

/**
 * Begin listening to UI elements
 * @param {module:blessed~screen} screen
 * @param {module:blessed~box} searchField
 * @param {module:blessed~listtable} searchList
 * @param {module:configdata~getDataCallback} get_data
 */
exports.listen = function( screen, searchField, searchList, get_data) {

	searchList.setData( get_data( "" ) );

	// Text Keys (Search)
	var key_array = ['space', 'backspace', "'", "#", 1,2,3,4,5,6,7,8,9,0];
	for(var i=65; i<127; i++) {
		key_array.push( String.fromCharCode(i) );
		key_array.push( "S-" + String.fromCharCode(i) );
	}
	screen.key(key_array, function(ch, key){
		if (screenFocus !== 'base') return;

		// Update the search string
		search_string =  searchField.getContent();
		if( key.name === 'backspace' ) {
			search_string = search_string.slice(0, -1)
		}else{
			search_string += ch;
		}
		searchField.setContent(search_string);

		// Now update the list
		searchList.setData( get_data( search_string ) );
		screen.render();
	});

	screen.key(['C-g'], function(ch, key) {
		if (screenFocus !== 'base') return;

		var brancherBox = blessed.box({
			top: 'center',
			left: 'center',
			width: 'shrink',
			height: 'shrink',
			content: 'Please wait. Retrieving all running Brancher nodes for this Hypernode.',
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				bg: 'red',
			}
		});

		screen.append(brancherBox);
		screen.render();

		setTimeout(function () {
			screen.leave();
			let item_index = searchList.selected;
			let hostname = searchList.rows[item_index];

			let branchers = hypernodeBrancher.fetchBrancherNodes(hostname);
			console.log(branchers.length + ' brancher(s) fetched for ' + hostname[0]);
			return process.exit(0);
		}, 2000);
	});

	screen.key(['C-a'], function(ch, key) {
		if (screenFocus !== 'base') return;

		let brancherBox = blessed.box({
			top: 'center',
			left: 'center',
			width: 'shrink',
			height: 'shrink',
			content: 'Please wait. Retrieving all running Brancher nodes for all Hypernodes. This might take a while.',
			tags: true,
			border: {
				type: 'line'
			},
			style: {
				fg: 'white',
				bg: 'red',
			}
		});

		screen.append(brancherBox);
		screen.render();

		setTimeout(function () {
			screen.leave();
			hypernodeBrancher.fetchBrancherNodes('all');
			return process.exit(0);
		}, 2000);
	});

	// Exit Keys
	screen.key(['escape', 'C-c'], function(ch, key) {
		if (screenFocus === 'form') {
			screen.remove(currentForm);
			screen.render();
			screenFocus = 'base';
		}else if (screenFocus === 'base') {
			return process.exit(0);
		}
	});

	// Enter (Run SSH / Display Form)
	screen.key(['enter'], function(ch, key){
		if (screenFocus !== 'base') return;

		var item_index = searchList.selected;
		var hostname = searchList.rows[item_index];

		// Escaping from Main Screen
		screen.leave();
		if (typeof hostname[4] === "undefined") { hostname[4] = "22"; }
		var child = screen.spawn('/usr/bin/ssh',[hostname[1] + '@' + hostname[3],'-p',hostname[4]]);
		child.on('close',function(){
			return process.exit(0);
		});

	});

	// Navigation keys
	screen.key(['right', 'left', 'up', 'down'], function(ch, key){
		if (screenFocus !== 'base') return;

		if( key.name === 'up' ) {
			if (searchList.selected === 1) {
				searchList.select(searchList.items.length);	// Go to the bottom
			}else {
				searchList.up(1);
			}
		}else if( key.name === 'down' ) {
			if (searchList.selected === searchList.items.length-1) {
				searchList.select(1);
			} else {
				searchList.down(1);
			}
		}
		selectorOffset = searchList.selected;
		screen.render();
	});
};
