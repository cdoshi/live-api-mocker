// Create a client to mongodb
const MongoClient = require('mongodb').MongoClient;
const url = process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : "mongodb://localhost:27017/";

module.exports = function () {

  const determineContentType = (contentType) => {

    if(contentType.indexOf('application/x-www-form-urlencoded') > -1) {
      return 'application/x-www-form-urlencoded';
    }

    if(contentType.indexOf('multipart/form-data') > -1) {
      return 'multipart/form-data';
    }

    if(contentType.indexOf('application/json') > -1) {
      return 'application/json';
    }

    return null;
  }

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
    MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {

      if (err) throw err;

      // Fetch the values
      const endpoint = req.body.endpoint;

      // If endpoint is not present, throw error
      if(!endpoint) {
        res.send({
          status: false,
          message: 'Endpoint is missing'
        });
        return;
      }

      const mockJSON = req.body.value ? req.body.value : {};
      const actionType = req.body.type ? req.body.type : 'POST';
      const contentType = req.body.contentType ? req.body.contentType : null;
      const bodyParams = req.body.bodyparams ? req.body.bodyparams : {};
      const splitEndpointURL = endpoint.split('?');

      const rootURL = splitEndpointURL[0];
      let queryParams = {};

      if(splitEndpointURL.length > 1) {
        const querystring = require('querystring');
        queryParams = querystring.parse(splitEndpointURL[1]);
      }

      try {
        const dbo = db.db("heroku_j59dvfgm");
        const myobj = {
          endpoint: handleSlashes(rootURL),
          queryParams: queryParams,
          json: mockJSON,
          bodyParams: bodyParams,
          date_added: new Date(),
          type: actionType,
          contentType: contentType
        };

        // Insert Document into the mongodb
        dbo.collection("apis").insertOne(myobj, (err, res1) => {
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
      const bodyParams = req.body;
      const contentType = req.method !== 'GET' ? determineContentType(req.headers['content-type']) : null;

      if(splitEndpointURL.length > 1) {
        const querystring = require('querystring');
        queryParams = querystring.parse(splitEndpointURL[1]);
      }

      const dbo = db.db('heroku_j59dvfgm');
      const myObj = {
        endpoint: handleSlashes(rootURL),
        type: req.method.toUpperCase(),
        contentType: contentType
      };

      // Provide the latest one
      dbo.collection("apis").find(myObj).sort( { _id : -1 } ).limit(1).toArray((err, results = []) => {
        if(results.length > 0) {

            const equal = require('deep-equal');

            if(equal(queryParams, results[0].queryParams) && equal(bodyParams, results[0].bodyParams)) {
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
