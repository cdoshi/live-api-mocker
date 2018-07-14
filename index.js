const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const handleRequest = require('./src/handleRequest')();

// Serve only files from public folder
app.use("/", express.static(path.join(__dirname, '/public')));

// Create a client to mongodb
const MongoClient = require('mongodb').MongoClient;
const url = process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : "mongodb://localhost:27017/";

// Enable cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Below code is needed to read the params from POST request
app.use(bodyParser.json());

// In case JSON parsing fails, send
app.use(function(err, req, res, next) {

  // Send error response
  res.status(200).send({
    status: false,
    message: 'Incorrect JSON has been provided'
  });
});

app.use(bodyParser.urlencoded({
  extended: true
}));

// Any get request would be routed to the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Post request with /mock-submit-api will be responsible for adding mock data to the mongodb server
app.post('/mock-submit-api',(req, res) => {
  handleRequest.mockSubmitAPI(req, res);
});


// Generic method to handle any request
app.all('*', (req, res, next) => {
  if(req.method.toUpperCase() === 'GET' && (req.originalUrl.indexOf('assets') > -1 || req.originalUrl.indexOf('favicon') > -1)) {
    next();
  } else {
    handleRequest.fetchAPI(req, res);
  }
});

// Listen for requests on the below ports
app.listen(process.env.PORT || 5000, () => console.log('App is listening on port 5000!'));
