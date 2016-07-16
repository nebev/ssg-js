'use strict';

var blessed = require('blessed');

/**
 * This function creates forms suitable to be consumed by listeners.js
 * @param array awsElements All AWS Information
 * @param Object screen Blessed Screen object
 * @return Object Most notable method is getForm()
 */
module.exports = function (awsElements, screen) {

    /**
     * Gets the server entry according to the awsServerString
     * @param string awsServerString A string (usually starting with 'A:' followed by AWS instance ID)
     * @return Object
     */
    var getServerEntry = function(awsServerString) {
        return awsElements.filter(function(el){
            return ('A:' + el.instanceId) === awsServerString; 
        })[0];
    };

    return {

        /**
         * Manufacture a form according to the AWS string
         * @param string awsServerString A string (usually starting with 'A:' followed by AWS instance ID)
         * @param function callback Function to call when form is submitted. Calls with 1 parameter with [keyfile] and [connection]
         */
        getForm: function(awsServerString, callback) {

            var server = getServerEntry(awsServerString);

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
                content: 'Enter your Server Connection Details',
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
            var keyFileText = blessed.text({
                parent: form,
                content: 'Key File:',
                left: 1,
                top: 5
            });
            var ipAddressText = blessed.text({
                parent: form,
                content: 'Address: ',
                left: 1,
                top: 7
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
            var keyFileInput = blessed.textbox({
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
                top: 5,
                name: 'keyfile',
            });
            keyFileInput.setValue('~/.ssh/' + server.keyName + ".pem");

            var addressSet = blessed.radioset({
                parent: form,
                left: 11,
                top: 7,
                shrink: true,
            });

            var networkRadios = [];
            server.network.forEach(function(address, addressIndex){
                networkRadios.push(
                    blessed.radiobutton({
                        parent: addressSet,
                        mouse: true,
                        keys: true,
                        shrink: true,
                        height: 1,
                        left: 0,
                        top: addressIndex,
                        name: address.address,
                        content: address.address + " - " + address.type
                    })
                );
            });
            if (networkRadios.length > 0) {
                networkRadios[networkRadios.length - 1].check();    // Usually last element is public
            }
            

            var submit = blessed.button({
                parent: form,
                mouse: true,
                keys: true,
                shrink: true,
                padding: {
                    left: 1,
                    right: 1
                },
                right: 3,
                bottom: 1,
                shrink: true,
                name: 'submit',
                content: 'Connect',
                style: {
                    fg: 'white',
                    bg: 'blue',
                    focus: {
                        inverse: true
                    }
                }
            });



            // Input Behaviours
            usernameInput.on('focus', function() {
                usernameInput.readInput();
            });
            keyFileInput.on('focus', function() {
                keyFileInput.readInput();
            });
            submit.on('press', function() {
                form.submit();
            });

            // Form Behaviour
            form.on('submit', function(data) {
                var address = '';
                for(var i in data) {
                    if (data[i] === true && i !== 'submit') {
                        address = i;
                    }
                }

                // Transform ~ into bash equivalent
                var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
                data.keyfile = data.keyfile.replace('~', home_dir);

                var result = {
                    keyfile: data.keyfile,
                    connection: data.username + '@' + address  
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
