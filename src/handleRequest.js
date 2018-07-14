// Create a client to mongodb
const MongoClient = require('mongodb').MongoClient;
const url = process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : "mongodb://localhost:27017/";

module.exports = function () {

  const handleSlashes = (str) => {
    var slashStr = str;

    if(str && str.length > 0) {
      // Beginning slash
      if(str[0] !== '/') {
        slashStr = '/' + slashStr;
      }

      // Trailing slash
      if(str[str.length - 1] !== '/') {
        slashStr = slashStr + '/';
      }
    }

    return slashStr;
  }

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
      const splitEndpointURL = endpoint.split('?');
      const rootURL = splitEndpointURL[0];
      let queryParams = {};

      if(splitEndpointURL.length > 1) {
        const querystring = require('querystring');
        queryParams = querystring.parse(splitEndpointURL[1]);
      }


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
          endpoint: handleSlashes(rootURL),
          queryParams: queryParams,
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
   * Function that handles fetching of APIs of any method
   */
  const fetchAPI = (req, res) => {

    // Connect to the DB
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;

      const splitEndpointURL = req.originalUrl.split('?');
      const rootURL = splitEndpointURL[0];
      let queryParams = {};

      if(splitEndpointURL.length > 1) {
        const querystring = require('querystring');
        queryParams = querystring.parse(splitEndpointURL[1]);
      }

      const dbo = db.db('heroku_j59dvfgm');
      const myObj = {
        endpoint: handleSlashes(rootURL),
        type: req.method.toUpperCase()
      };

      // Provide the latest one
      dbo.collection("apis").find(myObj).sort( { _id : -1 } ).limit(1).toArray(function(err, results = []){
        if(results.length > 0) {
            const equal = require('deep-equal');
            if(equal(queryParams, results[0].queryParams)) {
              res.send(results[0].json);
            } else {
              res.send({status: false, message: 'No results found'});
            }
        } else {
          res.send({status: false, message: 'No results found'});
        }
      });

      // Close the db connection
      db.close();
    });
  }


  return {
    mockSubmitAPI: mockSubmitAPI,
    fetchAPI: fetchAPI
  }
};
