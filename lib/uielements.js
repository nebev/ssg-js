'use strict';

// All UI Elements
var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen({
	smartCSR: true
});

screen.title = 'SSH Server Selection GUI (s)';

var header = blessed.box({
	left: 'center',
	top: 1,
	width: 30,
	height: 3,
	border: 'line',
	content: 'SSH Server Selection',
	align: 'center'
});
var searchText = blessed.text({
	content: "Search:",
	width: 10,
	height: 1,
	left: 'center',
	top: 4
});

// Append our box to the screen.
screen.append(header);
screen.append(searchText);

var searchList = blessed.listtable({
	parent: screen,
	align: 'left',
	data: [],
	width: '100%',
	height: '70%',
	bottom: 1,
	border: {
		type: 'line',
		fg: 'blue'
	},
	selectedBg: 'lightblue',
	selectedFg: 'white',
	selectedBold: 'true',
	clickable: true,
	mouse: false,
	noCellBorders: true,
	style:{
		header:{
			fg: 'blue'
		}
	},
	padding:{
		left: 1,
		right: 1
	}
});
screen.append(searchList);


// A box that gives the appearance of a form, but allows the multifunction typing/arrows that I like
var searchField = blessed.box({
	bg: 'blue',
	left: 'center',
	top: 5,
	height: 1,
	width: '50%',
	content: "",
	fg: 'white'
});
screen.append(searchField);

// Instructions Box
var instructions = blessed.box({
	left: 'center',
	bottom: 0,
	width: '100%',
	height: 1,
	content: '  [Enter: Connect] [Escape: Quit] [Ctrl+A: fetch all Brancher nodes] [Ctrl+G: fetch Brancher nodes for currently highlighted Hypernode]',
	align: 'left'
});
screen.append(instructions);

// Version Box
var version = blessed.box({
	right: 0,
	bottom: 0,
	width: 19,
	content: 'v0.4.0 (elgentos)',
	height: 1
});
screen.append(version);

/**
 * @module uielements
 */

module.exports = {
	/**
	 * @type {module:blessed~screen}
	 */
	screen: screen,

	/**
	 * @type {module:blessed~listtable}
	 */
	searchList: searchList,

	/**
	 * @type {module:blessed~box}
	 */
	searchField: searchField
};

/**
 * @typedef {Object} module:blessed~screen
 * @external
 * @see https://github.com/chjj/blessed#screen-from-node
 */

/**
 * @typedef {Object} module:blessed~listtable
 * @external
 * @see https://github.com/chjj/blessed#listtable-from-list
 */

/**
 * @typedef {Object} module:blessed~box
 * @external
 * @see https://github.com/chjj/blessed#box-from-element
 */
