// ==============================================
// Server, framework, socket.io, and database
// ==============================================
var express = require('express');
var app = express();
var http = require('http');
var db = require('redis-url').connect(process.env.REDISTOGO_URL);
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 5000;


// ===============================================
// Authentication, facebook, and payment library
// ===============================================
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;
var stripe_secret = process.env['STRIPE_SECRET_DEV'];
var facebook_secret = process.env['FACEBOOK_SECRET'];
var facebook_id = process.env['FACEBOOK_ID'];
var stripe = require('stripe')(stripe_secret);


// ===============================================
// App configuration
// ===============================================

// for debugging
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

// heroku doesn't support websockets, so we need to use longpolling : (
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

// set up the authentication
passport.use(new FacebookStrategy({
    clientID: facebook_id,
    clientSecret: facebook_secret,
    callbackURL: "http://localhost:5000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
    console.log(done);
    // User.findOrCreate(..., function(err, user) {
    //   if (err) { return done(err); }
    //   done(null, user);
    // });
  }
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'publish_actions' }));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/' }));




// ===============================================
// API
// Modify and view the internal state of
// the game via http requests from the client
// ===============================================
app.post('/api/payments', function(request, response){
    var charge = {};
    charge.amount = 99; // in cents
    charge.currency = 'usd';
    charge.card = request.body.id;

    console.log(request.body);
    stripe.charges.create(charge, function(err, response){
        if (err) {
            console.log(err);
        }
        else {
            console.log("charge complete!");
            console.log(response);
        }
    });
})

server.listen(port, function(){
    console.log('Listening on port ' + port);
});

io.sockets.on('connection', function(socket) {
    io.sockets.emit('message', {"message": "new person is connected"});
});


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
