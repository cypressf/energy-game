var express = require('express');
var db = require('redis-url').connect(process.env.REDISTOGO_URL);
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;

var stripe_secret = process.env['STRIPE_SECRET_DEV'];
var facebook_secret = process.env['FACEBOOK_SECRET'];
var facebook_id = process.env['FACEBOOK_ID'];

var app = express();
app.use(express.logger());

passport.use(new FacebookStrategy({
    clientID: facebook_id,
    clientSecret: facebook_secret,
    callbackURL: "http://localhost:8888/auth/facebook/callback"
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

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Listening on port ' + port);

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
