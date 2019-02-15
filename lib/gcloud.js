'use strict';
var Promise = require('bluebird');
var commandExists = require('command-exists');
var exec = require('promised-exec');
var flatMap = require('flatmap');
var fs = require('fs');
var child_process = require('child_process');
var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var cacheFile = home_dir + '/.ssh/.ssg-cache-gcloud';

/**
 * Run <gcloud auth login> to authenticate yourself on the command line
 */

/**
 * Process the gcloud JSON to return objects for ssg
 */
var processJson = function(gcloudJson) {
    var clusters = gcloudJson.map(function(cluster){
        return {
            hostname: cluster.name + '.elgentos.io',
            user: 'app', // all GCP clusters use Hypernode container, which has app as default user
            description: cluster.projectName + ' / ' + cluster.createTime + ' / ' + cluster.currentNodeVersion,
            network: cluster.endpoint
        };
    });

    return flatMap(clusters, function(el){
        return el;
    });
};

/**
 * Get the JSON from Google Cloud through gcloud
 */
var gcloudContainerClustersList = function(projectId, projectName) {
    let jsonString = child_process.execSync('gcloud container clusters list --project=' + projectId + ' --format=json').toString();
    // Add name to cluster object to show in list
    return JSON.parse(jsonString).map(function (cluster) {
        cluster.projectName = projectName;
        return cluster;
    });
};

var gcloudProjectsList = function() {
    var gcloudProjectsOut = child_process.execSync('gcloud projects list --format=json').toString();

    try {
        var gcloudProjects = JSON.parse(gcloudProjectsOut);
        var projects = gcloudProjects.map(function (project) {
            if (project.lifecycleState === 'ACTIVE') {
                return project;
            }
        });
        return flatMap(projects, function(el){
            return el;
        });
    } catch (e) {
        return [];
    }
};

/**
 * This function uses the gcloud CLI command to get a list of servers in order to further populate the SSG list
 */
exports.getServerList = function() {
    var clusters = [];
    var cmdExistsPromise = Promise.promisify(commandExists);

    return cmdExistsPromise('gcloud').then(function(a){
        if (fs.existsSync(cacheFile)) {
            var stats = fs.statSync(cacheFile);
            var mtime = new Date(stats.mtime);
            var yesterday = (function(d){ d.setDate(d.getDate()-1); return d})(new Date)

            // If cache file is newer than yesterday
            if (mtime > yesterday) {
                return processJson(JSON.parse(fs.readFileSync(cacheFile)));
            }
        }

        if(a === true) {
            var projects = gcloudProjectsList(); // production
            //var projects = [{projectId: 'bus-totaal', name: 'Bus Totaal'}, {projectId: 'dutchlabelshop', name: 'Dutchlabelshop'}]; // testing
            projects.forEach(function(project) {
                let list = gcloudContainerClustersList(project.projectId, project.name);
                clusters = clusters.concat(list);
            });

            // Write to cache file
            fs.writeFile(cacheFile, JSON.stringify(clusters), function (err) {
                if (err) return console.log(err);
            });

            return processJson(clusters);
        }
        return a;
    });
};