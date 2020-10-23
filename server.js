// import required essentials
const http = require('http');
const https = require('https')
const express = require('express');
var cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');

// create new app
const app = express();
app.use(express.json());
// use it before all route definitions
// allowing below URL to access these APIs end-points
// you can replace this URL(http://localhost:8100) with your
// application URL from where you are calling these APIs
app.use(cors({origin: 'http://tuyaserver.herokuapp.com'}));

/* this '/items' URL will have two end-points:
→ localhost:3000/items/ (this returns array of objects)
→ localhost:3000/items/:id (this returns single object)
*/

var apiHead = { client_id: "9ea9sk54a0k2978837d6", access_token: "", sign: "", sign_method: "HMAC-SHA256", t: 0};
var keyExpireTime = 0;
var refreshToken;
var brightness;
var lightsOn;
var workingMode;

const initialize = () => {
    var t = Date.now();
    const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
    apiHead.t = t;
    apiHead.sign = signature1;
    var options = {
        hostname: 'openapi.tuyaus.com',
        path: '/v1.0/token?grant_type=1',
        headers: apiHead
    };
    fetch('https://openapi.tuyaus.com/v1.0/token?grant_type=1', {
        headers: apiHead
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            apiHead.access_token = data['result']['access_token'];
            keyExpireTime = data['result']['expire_time'];
            refreshToken = data['result']['refresh_token'];
            console.log(apiHead);
            t = Date.now();
            const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
            apiHead.t = t;
            apiHead.sign = signature2;
            let opts = {
                hostname: 'openapi.tuyaus.com',
                path: '/v1.0/devices/64304636a4cf12d76aad/status',
                headers: apiHead
            };
            https.get(opts, (res2) => {
                const { statusCode } = res2;
                const contentType = res2.headers['content-type'];
                res2.setEncoding('utf8');
                let rawData = '';
                res2.on('data', (chunk) => { rawData += chunk; });
                res2.on('end', () => {
                    try {
                        let data = JSON.parse(rawData);
                        console.log(data)
                        brightness = data['result'][2]['value']
                        lightsOn = data['result'][0]['value']
                        workingMode = data['result'][1]['value']
                      //res.send(JSON.parse(rawData));
                    } catch (e) {
                      console.error(e.message);
                    }
                });
            });
        })
        .catch((error) => {console.log(error)});
}

app.use('/init', function(req, res) {
    var t = Date.now();
    const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
    apiHead.t = t;
    apiHead.sign = signature1;
    var options = {
        hostname: 'openapi.tuyaus.com',
        path: '/v1.0/token?grant_type=1',
        headers: apiHead
    };
    fetch('https://openapi.tuyaus.com/v1.0/token?grant_type=1', {
        headers: apiHead
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            apiHead.access_token = data['result']['access_token'];
            keyExpireTime = data['result']['expire_time'];
            refreshToken = data['result']['refresh_token'];
            console.log(apiHead);
            t = Date.now();
            const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
            apiHead.t = t;
            apiHead.sign = signature2;
            let opts = {
                hostname: 'openapi.tuyaus.com',
                path: '/v1.0/devices/64304636a4cf12d76aad/status',
                headers: apiHead
            };
            https.get(opts, (res2) => {
                const { statusCode } = res2;
                const contentType = res2.headers['content-type'];
                res2.setEncoding('utf8');
                let rawData = '';
                res2.on('data', (chunk) => { rawData += chunk; });
                res2.on('end', () => {
                    try {
                        let data = JSON.parse(rawData);
                        brightness = data['result'][2]['value']
                        lightsOn = data['result'][0]['value']
                        workingMode = data['result'][1]['value']
                      res.send(JSON.parse(rawData));
                    } catch (e) {
                      console.error(e.message);
                    }
                });
            });
        })
        .catch((error) => {console.log(error)});
    
});

app.use('/turnOn', function(req, res) {
    if (apiHead['access_token'] == "") {
        initialize();
    }
    
});

// default URL to API
app.use('/', function(req, res) {
    res.send("Nothing to see here")
});

const server = http.createServer(app);
const port = process.env.PORT || 8080;
server.listen(port);
console.debug('Server listening on port ' + port);