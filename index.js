const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Create a client to mongodb
const MongoClient = require('mongodb').MongoClient;
const url = process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : "mongodb://localhost:27017/";

// Below two lines are needed to read the params from POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Any get request would be routed to the home page
app.get('*', (req, res) => {
  res.send(JSON.stringify({
    success: true
  }));
});

// Post request with /mock-submit-api will be responsible for adding mock data to the mongodb server
app.post('/mock-submit-api',(req, res) => {

  // Connect to the DB
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {

    if (err) throw err;

    const dbo = db.db("heroku_j59dvfgm");

    // Fetch the values
    const endpoint = req.body.endpoint;
    const mockJSON = req.body.value;

    const myobj = { endpoint: endpoint, json: mockJSON };

    // Insert Document into the mongodb
    dbo.collection("apis").insertOne(myobj, function(err, res1) {
      if (err) throw err;

      res.send(JSON.stringify({
        success: true
      }));

      // Close the db connection
      db.close();
    });
  });
});

// If any other post request is made apart from the /mock-submit-api, check db and send back response
app.post('*', (req, res) => {

  // Connect to the DB
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;

    const dbo = db.db("heroku_j59dvfgm");
    const myObj = { endpoint: req.originalUrl };

    dbo.collection("apis").find(myObj).toArray(function(err, results = []){
      if(results.length > 0) {
          res.send(results[0].json);
      } else {
        res.send({status: false, message: 'No results found'});
      }

    });

    // Close the db connection
    db.close();
  });

});

// Listen for requests on the below ports
app.listen(process.env.PORT || 5000, () => console.log('App is listening on port 3000!'));
