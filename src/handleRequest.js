// Create a client to mongodb
const MongoClient = require('mongodb').MongoClient;
const url = process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : "mongodb://localhost:27017/";

module.exports = function () {

  /*
   * Function that handles submission of API
   */
  const mockSubmitAPI = (req, res) => {
    // Connect to the DB
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      // Fetch the values
      const endpoint = req.body.endpoint;
      const mockJSON = req.body.value ? req.body.value : {};
      const actionType = req.body.type ? req.body.type : 'POST';

      // If endpoint is not present, throw error
      if(!endpoint) {
        res.send({
          status: false,
          message: 'Endpoint is missing'
        });
      }

      try {
        const dbo = db.db("heroku_j59dvfgm");
        const myobj = {
          endpoint: endpoint,
          json: mockJSON,
          date_added: new Date(),
          type: actionType
        };

        // Insert Document into the mongodb
        dbo.collection("apis").insertOne(myobj, function(err, res1) {
          if (err) throw err;

          res.send({status: true});

          // Close the db connection
          db.close();
        });
      } catch(e) {
        res.send({
          status: false,
          message: 'Invalid JSON has been provided'
        });
      }
    });
  }

  /*
   * Function that handles fetching of POST APIs
   */
  const fetchPostAPI = (req, res) => {

    console.log(req.originalUrl);
    // Connect to the DB
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;

      const dbo = db.db('heroku_j59dvfgm');
      const myObj = { endpoint: req.originalUrl };

      // Provide the latest one
      dbo.collection("apis").find(myObj).sort( { _id : -1 } ).limit(1).toArray(function(err, results = []){
        if(results.length > 0) {
            res.send(results[0].json);
        } else {
          res.send({status: false, message: 'No results found'});
        }
      });

      // Close the db connection
      db.close();
    });
  }

  const fetchGetAPI = (req, res) => {

    // Connect to the DB
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {

      if (err) throw err;

      const dbo = db.db('heroku_j59dvfgm');
      const myObj = { endpoint: req.originalUrl, type: 'GET' };

      // Provide the latest one
      dbo.collection("apis").find(myObj).sort( { 'date_added' : -1 } ).limit(1).toArray(function(err, results = []) {
        if(results.length > 0) {
            res.send(results[0].json);
        } else {
          res.send({status: false, message: 'No results found'});
        }
      });

      // Close the db connection
      db.close();
    });
  };
  return {
    mockSubmitAPI: mockSubmitAPI,
    fetchPostAPI: fetchPostAPI,
    fetchGetAPI: fetchGetAPI
  }
};
