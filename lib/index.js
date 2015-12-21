exports.run = function() {
	var config = require('./configdata');
	var ui = require('./uielements');
	var listeners = require('./listeners');

	listeners.listen(
		ui.screen,
		ui.searchField,
		ui.searchList,
		config.get_data
	);
	ui.screen.render();
};