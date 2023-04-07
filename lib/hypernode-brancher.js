const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(os.homedir(), '.config', 'ssg'), {recursive: true});
const hypernodeTokensFile = path.join(os.homedir(), '.config', 'ssg', 'hypernodeTokens.json');
const hypernodeBranchersFile = path.join(os.homedir(), '.config', 'ssg', 'hypernodeBranchers.json');

let config = require('./configdata')();
let configData = config.get_data;

exports.fetchBrancherNodes = function (value) {
    let hostnameParts = '';
    let key = '';

    let existingHypernodeBranchers = {};
    let hostnames = [];
    if (value === 'all') {
        const hypernodes = configData("");
        hypernodes.forEach((value, index) => {
            const hostname = value[3];

            if (hostname.indexOf('.hypernode.io') < 0) {
                return;
            }

            hostnames.push(hostname);
        });
    } else {
        hostnames = [value[3]];
    }

    hostnames.forEach(function (hostname) {
        if (hostname.indexOf('.hypernode.io') < 0) {
            return;
        }

        console.log("Retrieving Brancher nodes for " + hostname);

        hostnameParts = hostname.split('.');
        key = hostnameParts[0];

        let hypernodeTokens = JSON.parse(fs.readFileSync(hypernodeTokensFile, {encoding: 'utf8'}));
        let hypernodeToken = hypernodeTokens[key];

        const command = `dev hypernode-api-cli brancher:list ${key} --token=${hypernodeToken} --output=json`;

        try {
            const output = execSync(command, {encoding: 'utf8', stdio: 'pipe'});

            let branchers = JSON.parse(output.trim());

            if (fs.existsSync(hypernodeBranchersFile)) {
                existingHypernodeBranchers = JSON.parse(fs.readFileSync(hypernodeBranchersFile, {encoding: 'utf8'}));
            }

            existingHypernodeBranchers[key] = [...existingHypernodeBranchers[key] ?? [], ...branchers];

            // Remove possible duplicates, based on `id`
            existingHypernodeBranchers[key] = existingHypernodeBranchers[key].reduce((acc, current) => {
                const index = acc.findIndex(item => item.id === current.id);
                return (index === -1 ? [...acc, current] : acc);
            }, []);
        } catch (error) {
            console.log(`Could not retrieve brancher nodes for ${hostname}, probably because the api token usage is not enabled in the control panel for this Hypernode.`);
        }
    });

    fs.writeFileSync(hypernodeBranchersFile, JSON.stringify(existingHypernodeBranchers), { encoding: 'utf8' });

    if (value !== 'all') {
        return existingHypernodeBranchers[key];
    } else {
        return existingHypernodeBranchers;
    }
}

exports.fetchHypernodeApiTokens = function() {
    const hypernodes = configData("");

    if (fs.existsSync(hypernodeTokensFile)) {
        const stats = fs.statSync(hypernodeTokensFile);
        const mtime = stats.mtime.getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - mtime < oneDay) {
            // load the JSON from the file if it hasn't been modified in the past 24 hours
            hypernodeTokens = JSON.parse(fs.readFileSync(hypernodeTokensFile, { encoding: 'utf8' }));
            return;
        }
    }

    hypernodeTokens = {};

    hypernodes.forEach((value, index) => {
        const hostname = value[3];

        if (hostname.indexOf('.hypernode.io') < 0) {
            return;
        }

        const hostnameParts = hostname.split('.');
        const key = hostnameParts[0];

        const sshCommand = `ssh -o "StrictHostKeyChecking=no" ${value[1]}@${hostname} -p ${value[4]} 'cat /etc/hypernode/hypernode_api_token'`;
        const output = execSync(sshCommand, { encoding: 'utf8', stdio: 'pipe', input: value[2] });
        hypernodeTokens[key] = output.trim();
        console.log(`Retrieved Hypernode API token for ${hostname}`);
    });

    fs.writeFileSync(hypernodeTokensFile, JSON.stringify(hypernodeTokens), { encoding: 'utf8' });
    console.log('Saved hypernodeTokens to file');
}

exports.getServerList = function () {
    if (fs.existsSync(hypernodeBranchersFile)) {
        return JSON.parse(fs.readFileSync(hypernodeBranchersFile, {encoding: 'utf8'}));
    }
    return {};
}
