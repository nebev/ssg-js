'use strict';

var blessed = require('blessed');

/**
 * This function creates forms suitable to be consumed by listeners.js
 * @param array awsElements All AWS Information
 * @param Object screen Blessed Screen object
 * @return Object Most notable method is getForm()
 */
module.exports = function (awsElements, screen) {

    return {

        /**
         * Manufacture a form according to the AWS string
         * @param string serverName A string (usually starting with 'A:' followed by AWS instance ID)
         * @param function callback Function to call when form is submitted. Calls with 1 parameter with [keyfile] and [connection]
         */
        getForm: function(serverName, callback) {
            // Form
            var form = blessed.form({
                parent: screen,
                mouse: true,
                keys: true,
                vi: false,
                left: 'center',
                top: 'center',
                width: 65,
                height: 15,
                style: {
                    border: {
                        inverse: true
                    }
                },
                content: 'Enter your DigitalOcean droplet SSH username',
                align: 'center',
                scrollable: false,
                border: 'line'
            });

            // Text
            var usernameText = blessed.text({
                parent: form,
                content: 'Username:',
                left: 1,
                top: 3
            });

            // Inputs
            var usernameInput = blessed.textbox({
                parent: form,
                mouse: true,
                keys: true,
                style: {
                    fg: 'white',
                    bg: 'blue',
                    focus: {
                        inverse: true
                    }
                },
                height: 1,
                width: 50,
                left: 11,
                top: 3,
                name: 'username'
            });

            // var submit = blessed.button({
            //     parent: form,
            //     mouse: true,
            //     keys: true,
            //     padding: {
            //         left: 1,
            //         right: 1
            //     },
            //     right: 3,
            //     bottom: 1,
            //     shrink: true,
            //     name: 'submit',
            //     content: 'Connect',
            //     style: {
            //         fg: 'white',
            //         bg: 'blue',
            //         focus: {
            //             inverse: true
            //         }
            //     }
            // });

            // Input Behaviours
            usernameInput.on('focus', function() {
                usernameInput.readInput();
            });
            usernameInput.on('submit', function() {
                form.submit();
            });
            // submit.on('press', function() {
            //     form.submit();
            // });

            // Form Behaviour
            form.on('submit', function(data) {

                var result = {
                    username: data.username
                };

                // Run the callback specified
                callback(result);
            });

            // Default Highlighting
            form.focusNext()

            return form;
        }
    };

};
