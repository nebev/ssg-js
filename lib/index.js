'use strict';

/**
 * @module ssg-js
 */

const hypernodeBrancher = require("./hypernode-brancher");
const ui = require("./uielements");
const listeners = require("./listeners");
/**
 * Run program
 */
exports.run = function() {
	let config = require('./configdata')();
	let configData = config.get_data;

	// Fetch Hypernode API tokens from production Hypernodes
	hypernodeBrancher.fetchHypernodeApiTokens()

	// Populate data from Hypernode brancher file if possible
	let serverList = hypernodeBrancher.getServerList();
	Object.keys(serverList).forEach(key => {
		config.add_entries(serverList[key].map(function(brancher){

			const createdDate = new Date(brancher.created);
			const nowDate = new Date();

			const diffMs = nowDate - createdDate;
			const cost = (diffMs / 6000000).toFixed(2);

			const timeDiff = nowDate.getTime() - createdDate.getTime();
			const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

			return [
				'Brancher: ' + brancher.labels.subdomain,
				brancher.user ?? 'app',
				brancher.description ?? `Running for ${days} days, ${hours} hours, ${minutes} minutes (current cost: €${cost})`,
				brancher.network ?? brancher.labels.subdomain + '.' + brancher.ip + '.magento2.elgentos.io',
				brancher.port ?? '22'
			];
		}));
	});

	// Update the Search List
	ui.searchList.setData(config.get_data( listeners.getSearchString() ));
	ui.searchList.select(listeners.getSelectorOffset()); // So our currently selected item doesn't get reset
	ui.screen.render();

	listeners.listen(
		ui.screen,
		ui.searchField,
		ui.searchList,
		configData
	);
	ui.screen.render();
};
