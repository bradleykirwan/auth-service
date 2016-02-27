var default_ttl = 900;

var yargs = require('yargs').argv;
var fs = require('fs');
var express = require('express');
var https = require('https');
var privateKey = fs.readFileSync('ssl/server.key', 'utf8');
var certificate = fs.readFileSync('ssl/server.crt', 'utf8');
var query = require('pg-query');
query.connectionParameters = yargs['connection-params'];
var Q = require('q');
var _ = require('lodash');
var uuid = require('node-uuid');
var md5 = require('md5');
var NodeCache = require( "node-cache" );

var ttl = _.isUndefined(yargs['ttl']) ? default_ttl : yargs['ttl'];
var tokenCache = new NodeCache({stdTTL:ttl});

var app = express();

app.get('/', function(req, res) {
    res.send({
        uptime: process.uptime()
    });
});

app.post('/validate', function(req, res) {
    var token = req.headers['token'];
    var userId = tokenCache.get(token);

    if (_.isUndefined(userId)) {
        res.send({success:false});
    } else {
        res.send({success:true, userId:userId});
        tokenCache.ttl(token, ttl);
    }
});

app.post('/login', function(req, res) {
    var username = req.headers['username'];
    var password = req.headers['password'];

    if (_.isUndefined(username) || _.isUndefined(password)) {
        res.send('Username or password missing from request.');
        return;
    }
    requestToken(username, password)
        .then(function(result) {
            res.send(result);
        });
});

function updateLastLogin(userId) {
    var deferred = Q.defer();
    var query_string = 'UPDATE users SET last_login = NOW() WHERE id = $1';

    query(query_string, [userId], function(err, rows, result) {
        deferred.resolve();
    });

    return deferred.promise;
}

function getCustomerId(username, password) {
    var deferred = Q.defer();
    var query_string = 'SELECT id FROM users WHERE (username = $1 OR email = $1) AND password = crypt($2, password)';

    query(query_string, [username, password],
        function(err, rows, result) {
            if (_.isNull(err) && rows.length == 1) {
                deferred.resolve(rows[0]['id']);
            } else {
                deferred.reject();
            }
        });

    return deferred.promise;
}

function requestToken(username, password) {
    var deferred = Q.defer();

    getCustomerId(username, password)
        .then(function(result) {
            var token = uuid.v4();
            tokenCache.set(token, result);
            deferred.resolve({success:true,token:token});
            updateLastLogin(result);
        }).catch(function(error) {
            deferred.resolve({success:false});
        });

    return deferred.promise;
}

var credentials = {
    key: privateKey,
    cert: certificate
};

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);

//app.listen(3000, function() {
//    console.log('Authentication service now running on port: 3000');
//});