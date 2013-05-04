var express = require('express');
var redis = require('redis');
var config = require("./config");
var stripe = require('stripe')(config.stripe_api_key);
// var db = redis.createClient(6379, 'nodejitsudb7334094310.redis.irstack.com');
var app = express();

// db.auth(config.redis_api_key, function(err) {
//     if (err) {
//         throw err;
//     }
// });
// db.on("error", function (err) {
//     console.log("Error " + err);
// });

// db.on('ready', function () { // without this part, redis connection will fail
//   // do stuff with your redis
// });
app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});

// app.get('/', function(req, res){
//     var body = 'Hello World';
//     res.setHeader('Content-Type', 'text/plain');
//     res.setHeader('Content-Length', body.length);
//     res.end(body);
// });

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
