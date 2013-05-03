var express = require('express');
var config = require("./config");
var api_key = config.stripe_api_key;
var stripe = require('stripe')(api_key);
var app = express();

app.get('/', function(req, res){
    var body = 'Hello World';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});

app.listen(8888);
console.log('Listening on port 8888');

function create_stripe_customer() {
    stripe.customers.create(
       { email: 'foobar@example.org' },
       function(err, customer) {
          if (err) {
             console.log(err.message);
             return;
          }
          console.log("customer id", customer.id);
       }
     );
}
