// import required essentials
const http = require('http');
const express = require('express');
var cors = require('cors');
const crypto = require('crypto');

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

let apiHead = { client_id: '9ea9sk54a0k2978837d6', access_token: '', sign: '', sign_method: 'HMAC-SHA256', t: 0};


app.use('/init', function(req, res) {
    const hmac1 = crypto.createHmac('sha256', 'd6034d97286c4b049ee16874a5a2d92d');
    hmac1.update(apiHead[client_id]);
    var t;
    http.get('http://now.zerynth.com/', (res2) => {
        const { statusCode } = res2;
        const contentType = res2.headers['content-type'];
        res2.setEncoding('utf8');
        let rawData = '';
        res2.on('data', (chunk) => { rawData += chunk; });
        res2.on('end', () => {
            try {
              t = JSON.parse(rawData["now"]);
            } catch (e) {
              console.error(e.message);
            }
        });
    });
});

// default URL to API
app.use('/', function(req, res) {
    res.send("Nothing to see here")
    http.get('http://now.zerynth.com/', (res2) => {
        const { statusCode } = res2;
        const contentType = res2.headers['content-type'];
        res2.setEncoding('utf8');
        let rawData = '';
        res2.on('data', (chunk) => { rawData += chunk; });
        res2.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData[now]);
              res.send(parsedData)
            } catch (e) {
              console.error(e.message);
            }
        });
    });
});

const server = http.createServer(app);
const port = process.env.PORT || 8080;
server.listen(port);
console.debug('Server listening on port ' + port);