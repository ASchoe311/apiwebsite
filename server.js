// import required essentials
const http = require('http');
const https = require('https')
const express = require('express');
var cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');
const path = require('path');
const { access } = require('fs');

// create new app
const app = express();
app.use(express.json());
app.use(express.Router())
// app.use(express.static("express"));
// use it before all route definitions
// allowing below URL to access these APIs end-points
// you can replace this URL(http://localhost:8100) with your
// application URL from where you are calling these APIs
app.use(cors({origin: 'http://tuyaserver.herokuapp.com'}));

/* this '/items' URL will have two end-points:
→ localhost:3000/items/ (this returns array of objects)
→ localhost:3000/items/:id (this returns single object)
*/

const redHSV = {'h': 0, 's': 255, 'v': 255}
const yellowHSV = {'h': 60, 's': 255, 'v': 255}
const greenHSV = {'h': 120, 's': 255, 'v': 255}
const skyHSV = {'h': 180, 's': 255, 'v': 255}
const blueHSV = {'h': 240, 's': 255, 'v': 255}
const purpleHSV = {'h': 300, 's': 255, 'v': 255}
const whiteHSV = {'h': 0, 's': 0, 'v': 255}


const gorgCommand = JSON.stringify({commands: [{"code": "flash_scene_4",
                "value": {
                    "bright": 255,
                    "frequency": 191,
                    "hsv": [
                        redHSV, yellowHSV, greenHSV, skyHSV, blueHSV, purpleHSV
                    ],
                    "temperature": 0
                }}]});
                const onCommand = JSON.stringify({commands: [{'code': 'switch_led', 'value': true}]});
                const offCommand = JSON.stringify({commands: [{'code': 'switch_led', 'value': false}]});
const brightCommand = {commands: [{'code': 'bright_value', 'value': 0}]};
const whiteCommand = JSON.stringify({commands: [{'code': 'work_mode', 'value': 'white'}]});

const devices = {lights: ["64304636a4cf12d76aad", "55008855483fdac28931"], vals: [false, false], modes: ['white', 'white']}
var apiHead = { client_id: "9ea9sk54a0k2978837d6", access_token: "", sign: "", sign_method: "HMAC-SHA256", t: 0};
var keyExpireTime = 0;
var refreshToken;
var accessTokenInterval;
var brightness;
var keyGetTime;

const refreshAccessToken = (rt) => {
    var t = Date.now();
    const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
    apiHead.t = t;
    apiHead.sign = signature1;
    let refreshPath = 'https://openapi.tuyaus.com/v1.0/token/' + refreshToken;
    fetch(refreshPath, {
        headers: apiHead
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(apiHead);
            console.log(data);
            apiHead.access_token = data['result']['access_token'];
            keyExpireTime = data['result']['expire_time'];
            refreshToken = data['result']['refresh_token'];
            t = Date.now();
            const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
            apiHead.t = t;
            apiHead.sign = signature2;
            console.log(apiHead);
            // clearInterval();
            //accessTokenInterval = setTimeout(refreshAccessToken, 7200000, refreshToken);
            return [data['result']['access_token'], signature2, t];
        })
        .catch((error) => {console.log(error)});
};

const initialize = () => {
    var t = Date.now();
    keyGetTime = t;
    const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
    apiHead.t = t;
    apiHead.sign = signature1;
    fetch('https://openapi.tuyaus.com/v1.0/token?grant_type=1', {
        headers: apiHead
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            apiHead.access_token = data['result']['access_token'];
            keyExpireTime = data['result']['expire_time'];
            refreshToken = data['result']['refresh_token'];
            //accessTokenInterval = setTimeout(refreshAccessToken, keyExpireTime*1000, refreshToken)
            // setTimeout(refreshAccessToken, keyExpireTime*1000, refreshToken);
            t = Date.now();
            const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
            apiHead.t = t;
            apiHead.sign = signature2;
            console.log(apiHead);
            printTimeLeft();
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
                        // console.log(data)
                        brightness = data['result'][2]['value']
                        devices['vals'][0] = data['result'][0]['value']
                        devices['vals'][1] = data['result'][0]['value']
                        devices['modes'][0] = data['result'][1]['value']
                        devices['modes'][1] = data['result'][1]['value']
                      //res.send(JSON.parse(rawData));
                    } catch (e) {
                      console.error(e.message);
                    }
                });
            });
        })
        .catch((error) => {console.log(error)});
}

function printTimeLeft() {
    console.log(keyExpireTime);
    console.log(keyGetTime);
    console.log(Date.now());
    let timeLeft = keyGetTime + keyExpireTime - Date.now()
    let hrsLeft = Math.floor(timeLeft / 3600);
    let minsLeft = Math.floor((timeLeft / 60) - (hrsLeft * 60));
    let secsLeft = timeLeft % 60;
    let logOut = "Key time remaining: " + hrsLeft + " hours, " + minsLeft + " minutes, " + secsLeft + " seconds";
    console.log(logOut);
}

initialize();
setInterval(printTimeLeft, 300000);

app.post('/onoff', async function(req, res) {
    let result = true;
    for (var i = 0; i < devices['lights'].length; ++i) {
        var commandEnd = "/v1.0/devices/" + devices['lights'][i] + "/commands";
        let opts = {
            hostname: 'openapi.tuyaus.com',
            method: "POST",
            path: commandEnd,
            headers: apiHead
        }
        const req2 = https.request(opts, (res2) => {
            const { statusCode } = res2;
            const contentType = res2.headers['content-type'];
            res2.setEncoding('utf8');
            let rawData = '';
            res2.on('data', (chunk) => { rawData += chunk; });
            res2.on('end', () => {
                try {
                    let data = JSON.parse(rawData);
                    if (data['success'] == false){
                        result = false;
                        (async() => {
                            var t = Date.now();
                            const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
                            apiHead.t = t;
                            keyGetTime = t;
                            apiHead.sign = signature1;
                            let refreshPath = 'https://openapi.tuyaus.com/v1.0/token/' + refreshToken;
                            try{
                                let response = await fetch(refreshPath, {headers: apiHead});
                                let data = await response.json();
                                console.log(data);
                                console.log(apiHead);
                                apiHead.access_token = data['result']['access_token'];
                                keyExpireTime = data['result']['expire_time'];
                                refreshToken = data['result']['refresh_token'];
                                t = Date.now();
                                const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
                                apiHead.t = t;
                                apiHead.sign = signature2;
                                console.log(apiHead);
                                // clearTimeout();
                            } catch (e) {
                                console.error(e.message);
                            }
                        })();
                    }
                } catch (e) {
                    console.error(e.message);
                }
                if (result == true) {
                    if (devices['vals'][i] == true) {
                        req2.write(offCommand);
                        devices['vals'][i] = false;
                    } else {
                        req2.write(onCommand);
                        devices['vals'][i] = true;
                    }
                }
                req2.end();
            });
        });
    }
    let commandLineOut = "Turned lights " + (devices['vals'][0] == true ? "on" : "off");
    console.log(commandLineOut);
    res.status(200).json({command: "on/off", results: {sucess: true, changed_to: devices['vals'][0]}});
});

app.post('/modechange', async function(req, res) {
    for (var i = 0; i < devices['lights'].length; ++i) {
        var commandEnd = "/v1.0/devices/" + devices['lights'][i] + "/commands";
        let opts = {
            hostname: 'openapi.tuyaus.com',
            method: "POST",
            path: commandEnd,
            headers: apiHead
        }
        const req2 = https.request(opts, (res2) => {
            const { statusCode } = res2;
            const contentType = res2.headers['content-type'];
            res2.setEncoding('utf8');
            let rawData = '';
            res2.on('data', (chunk) => { rawData += chunk; });
            res2.on('end', () => {
                try {
                    let data = JSON.parse(rawData);
                    if (data['success'] == false){
                        (async() => {
                            var t = Date.now();
                            const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
                            apiHead.t = t;
                            keyGetTime = t;
                            apiHead.sign = signature1;
                            let refreshPath = 'https://openapi.tuyaus.com/v1.0/token/' + refreshToken;
                            let response = await fetch(refreshPath, {headers: apiHead});
                            let data = await response.json();
                            console.log(data);
                            console.log(apiHead);
                            apiHead.access_token = data['result']['access_token'];
                            keyExpireTime = data['result']['expire_time'];
                            refreshToken = data['result']['refresh_token'];
                            t = Date.now();
                            const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
                            apiHead.t = t;
                            apiHead.sign = signature2;
                            console.log(apiHead);
                            // clearTimeout();
                            // result = false;
                            // let newHead = refreshAccessToken(refreshToken);
                            req2.setHeader('access_token', apiHead.access_token);
                            req2.setHeader('sign', apiHead.sign);
                            req2.setHeader('t', apiHead.t);
                        })();
                    }
                } catch (e) {
                  console.error(e.message);
                }
            });
        });
        if (devices['modes'][i] == 'scene_4') {
            req2.write(whiteCommand);
            devices['modes'][i] = 'white';
        } else {
            req2.write(gorgCommand);
            devices['modes'][i] = 'scene_4';
        }
        req2.end();
    }
    let commandLineOut = "Mode changed to " + (devices['modes'][0] == 'white' ? "white" : "rainbow");
    console.log(commandLineOut);
    res.status(200).json({command: "changeMode", results: {sucess: true, changed_to: devices['modes'][0]}});
});


app.post('/brightup', async function(req, res) {
    let oldBrightness = brightness;
    if (brightness != 255 && devices['modes'][0] != "scene_4") {
        let thisCommand = brightCommand;
        if (brightness + 23 >= 255) {
            thisCommand['commands'][0]['value'] = 255;
            brightness = 255;
        } else {
            thisCommand['commands'][0]['value'] = brightness + 23;
            brightness = brightness + 23;
        }
        for (var i = 0; i < devices['lights'].length; ++i){
            var commandEnd = "/v1.0/devices/" + devices['lights'][i] + "/commands";
            let opts = {
                hostname: 'openapi.tuyaus.com',
                method: "POST",
                path: commandEnd,
                headers: apiHead
            }
            const req2 = https.request(opts, (res2) => {
                const { statusCode } = res2;
                const contentType = res2.headers['content-type'];
                res2.setEncoding('utf8');
                let rawData = '';
                res2.on('data', (chunk) => { rawData += chunk; });
                res2.on('end', () => {
                    try {
                        let data = JSON.parse(rawData);
                        if (data['success'] == false){
                            (async() => {
                                var t = Date.now();
                                const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
                                apiHead.t = t;
                                keyGetTime = t;
                                apiHead.sign = signature1;
                                let refreshPath = 'https://openapi.tuyaus.com/v1.0/token/' + refreshToken;
                                let response = await fetch(refreshPath, {headers: apiHead});
                                let data = await response.json();
                                console.log(data);
                                console.log(apiHead);
                                apiHead.access_token = data['result']['access_token'];
                                keyExpireTime = data['result']['expire_time'];
                                refreshToken = data['result']['refresh_token'];
                                t = Date.now();
                                const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
                                apiHead.t = t;
                                apiHead.sign = signature2;
                                console.log(apiHead);
                                // clearTimeout();
                                // result = false;
                                // let newHead = refreshAccessToken(refreshToken);
                                req2.setHeader('access_token', apiHead.access_token);
                                req2.setHeader('sign', apiHead.sign);
                                req2.setHeader('t', apiHead.t);
                            })();
                        }
                    } catch (e) {
                      console.error(e.message);
                    }
                });
            });
            req2.write(JSON.stringify(thisCommand));
            req2.end();
        }
    }
    let commandLineOut = (brightness == oldBrightness ? "Brightness unchanged" : "Brightness changed to " + brightness);
    console.log(commandLineOut);
    res.status(200).json({command: "brightnessUp", results: {sucess: true, changed_to: brightness}});
});

app.post('/brightdown', async function(req, res) {
    let oldBrightness = brightness;
    let canChange = (brightness != 25 && devices['modes'][0] != "scene_4");
    if (canChange) {
        let thisCommand = brightCommand;
        if (brightness - 23 <= 25) {
            thisCommand['commands'][0]['value'] = 25;
            brightness = 25;
        } else {
            thisCommand['commands'][0]['value'] = brightness - 23;
            brightness = brightness - 23;
        }
        for (var i = 0; i < devices['lights'].length; ++i) {
            var commandEnd = "/v1.0/devices/" + devices['lights'][i] + "/commands";
            let opts = {
                hostname: 'openapi.tuyaus.com',
                method: "POST",
                path: commandEnd,
                headers: apiHead
            }
            const req2 = https.request(opts, (res2) => {
                const { statusCode } = res2;
                const contentType = res2.headers['content-type'];
                res2.setEncoding('utf8');
                let rawData = '';
                res2.on('data', (chunk) => { rawData += chunk; });
                res2.on('end', () => {
                    try {
                        let data = JSON.parse(rawData);
                        if (data['success'] == false){
                            (async() => {
                                var t = Date.now();
                                const signature1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead['client_id']).update(t.toString()).digest("hex").toUpperCase();
                                apiHead.t = t;
                                keyGetTime = t;
                                apiHead.sign = signature1;
                                let refreshPath = 'https://openapi.tuyaus.com/v1.0/token/' + refreshToken;
                                let response = await fetch(refreshPath, {headers: apiHead});
                                let data = await response.json();
                                console.log(data);
                                console.log(apiHead);
                                apiHead.access_token = data['result']['access_token'];
                                keyExpireTime = data['result']['expire_time'];
                                refreshToken = data['result']['refresh_token'];
                                t = Date.now();
                                const signature2 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d').update(apiHead.client_id).update(apiHead.access_token).update(t.toString()).digest("hex").toUpperCase();
                                apiHead.t = t;
                                apiHead.sign = signature2;
                                console.log(apiHead);
                                // clearTimeout();
                                // result = false;
                                // let newHead = refreshAccessToken(refreshToken);
                                req2.setHeader('access_token', apiHead.access_token);
                                req2.setHeader('sign', apiHead.sign);
                                req2.setHeader('t', apiHead.t);
                            })();
                        }
                    } catch (e) {
                      console.error(e.message);
                    }
                });
            });
            req2.write(JSON.stringify(thisCommand));
            req2.end();
        }
    }
    let commandLineOut = (brightness == oldBrightness ? "Brightness unchanged" : "Brightness changed to " + brightness);
    console.log(commandLineOut);
    res.status(200).json({command: "brightnessDown", results: {sucess: true, changed_to: brightness}});
});

app.get('/keepalive', function(req, res) {
    console.log("STAYING ALIVE, STAYING ALIVE");
    res.status(200).json({command: "keepAlive", results: {sucess: true}});
});


app.post('/newtoken', function(req, res) {
    //refreshAccessToken(refreshToken);
    res.status(200).json({command: "newToken", results: {sucess: true}});
});

app.get('/messup', function(req, res) {
    console.log("Messing up...");
    console.log(apiHead);
    apiHead.access_token = "badaccess";
    console.log(apiHead);
    console.log("Done");
    res.status(200).json({command: "keepAlive", results: {sucess: true}});
})

app.get('/site', function(req, res) {
    res.sendFile(path.join(__dirname+'/express/index.html'));
});

// default URL to API
app.get('/', function(req, res) {
    res.send("Nothing to see here");
});


app.get('*', function(req, res){
    res.status(404).send('I think you\'re lost...');
});

const server = http.createServer(app);
const port = process.env.PORT || 8080;
server.listen(port);
console.debug('Server listening on port ' + port);