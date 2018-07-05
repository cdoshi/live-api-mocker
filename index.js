const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('*', (req, res) => res.send('Hello World!'));

// When user submits the endpoint api with json data
app.post('/submit-api',(req, res) => {

  res.send(JSON.stringify({
    success: true
  }));

});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
