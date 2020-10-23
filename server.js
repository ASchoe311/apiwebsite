// import required essentials
const http = require('http');
const express = require('express');
var cors = require('cors');
// import `items` from `routes` folder 
const itemsRouter = require('./routes/items');

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
app.use('/items', itemsRouter);
app.use('/turnOn', itemsRouter);

// default URL to API
app.use('/', function(req, res) {
    http.get('http://now.zerynth.com/', (res2) => {
        const { statusCode } = res2;
        const contentType = res2.headers['content-type'];
        res2.setEncoding('utf8');
        let rawData = '';
        res2.on('data', (chunk) => { rawData += chunk; });
        res2.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData);
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