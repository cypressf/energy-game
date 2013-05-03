
var http = require("http");
var api_key = 'abcdef';  // secret stripe API key
var stripe = require('stripe')(api_key);

http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Hello World");
  response.end();
}).listen(8888);


var create_stripe_customer function() {
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
