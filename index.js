const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

// Create a client to mongodb
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";


// Any get request would be routed to the home page
app.get('*', (req, res) => {
  res.send(JSON.stringify({
    success: true
  }));
});

// Post request with /mock-submit-api will be responsible for adding mock data to the mongodb server
app.post('/mock-submit-api',(req, res) => {

  // Connect to the DB
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    const dbo = db.db("mock-apis");

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
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    const dbo = db.db("mock-apis");

    const myObj = { endpoint: req.originalUrl };

    console.log(req.originalUrl);

    dbo.collection("apis").find(myObj).toArray(function(err, results){
      res.send(results[0].json)
    });



    // Close the db connection
    db.close();
  });

});

// Listen for requests on the below ports
app.listen(process.env.PORT || 5000, () => console.log('App is listening on port 3000!'));
