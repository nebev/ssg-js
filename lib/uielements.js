/**
 * All UI Elements
 */
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
	content: ""
});
screen.append(searchField);

// Instructions Box
var instructions = blessed.box({
	left: 'center',
	bottom: 0,
	width: '100%',
	height: 1,
	content: '  [Enter: Connect] [Escape: Quit]',
	align: 'left'
});
screen.append(instructions);

module.exports = {
	screen: screen,
	searchList: searchList,
	searchField: searchField
};