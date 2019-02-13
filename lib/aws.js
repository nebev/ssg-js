'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');

/**
 * This function uses the AWS CLI command (aws - must be configured to give JSON output)
 *   to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('aws').then(function(a){
        return false; // we do not use AWS EC2 instances and this command throws a warning when ran when they do not exist
        if(a === true) {
            return exec('aws ec2 describe-instances --filters "Name=instance-state-code,Values=16"').then(function(awsOut){
                try {
                    var parsedJSON = JSON.parse(awsOut);

                    var result = parsedJSON.Reservations.map(function(reservation){
                        var reservationInstances = reservation.Instances.map(function(instance){
                            
                            var primaryName = instance.Tags.filter(function(tagEl){
                                return tagEl.Key === 'Name';
                            });
                            
                            var networkAddresses = instance.NetworkInterfaces.map(function(network){
                                var addresses = [{
                                    address: network.PrivateIpAddress,
                                    type: 'private'
                                }];
                                if ('Association' in network && 'PublicIp' in network.Association) {
                                    addresses.push({
                                        address: network.Association.PublicIp,
                                        type: 'public'
                                    });
                                }
                                return addresses;
                            });

                            return {
                                instanceId: instance.InstanceId,
                                hostname: primaryName[0].Value,
                                description: '',
                                tags: '',
                                type: 'aws',
                                keyName: instance.KeyName,
                                network: flatMap(networkAddresses, function(nwa){ return nwa; })
                            };
                        });
                        return reservationInstances;
                    });
                    
                    return flatMap(result, function(el){
                        return el;
                    });

                } catch (e) {
                    // console.error('Couldnt exec', e);
                    return [];
                }
            });
        }
        return a;
    });

};