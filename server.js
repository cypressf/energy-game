var express =     require('express'),
    http =        require('http'),
    db =          require('redis-url').connect(process.env.REDISTOGO_URL),
    redis_store = require('connect-redis')(express),
    io_session =  require('socket.io-session'),
    path =        require('path'),
    stripe =      require('stripe')(process.env['STRIPE_SECRET_DEV']),
    io =          require('socket.io'),
    Game =        require('./game'),
    Like_button = require('./like_button'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    mongoose = require("mongoose");

require("./models/user");
var User = mongoose.model('User')
var app = express(),
    server = http.createServer(app),
    io = io.listen(server),
    session_store = new redis_store({client:db});
    port = process.env.PORT || 5000;

mongoose.connect(process.env['MONGOHQ_URL'], function (err, res) {
    if (err) { 
        console.log ('ERROR connecting to: ' + process.env['MONGOHQ_URL'] + '. ' + err);
    }
    else {
        console.log ('Succeeded connected to: ' + process.env['MONGOHQ_URL']);
    }
});


app.configure(function () {
    // app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', store: session_store, cookie: { maxAge: 30*1000*60*60*24 }}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

io.configure(function () {
    // heroku doesn't support websockets, so we need to use longpolling
    // https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10);

    // reduce debug logging
    // http://stackoverflow.com/questions/6807775/socket-io-remove-debug-mode
    io.set('log level', 1);

    // give socket.io access to express sessions
    // https://npmjs.org/package/socket.io-session
    io.set('authorization', io_session(express.cookieParser('secret'), session_store)); 
});

passport.use(new FacebookStrategy({
    clientID: process.env['FACEBOOK_ID'],
    clientSecret: process.env['FACEBOOK_SECRET'],
    callbackURL: "http://localhost:5000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        User.findOne({ 'facebook.id': profile.id }, function (err, user) {
            if (err) { return done(err) }
            if (!user) {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    username: profile.username,
                    provider: 'facebook',
                    facebook: profile._json
                });
                user.save(function (err) {
                    if (err) console.log(err)
                    return done(err, user)
                });
            }
            else {
              return done(err, user)
            }
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function (err, user) {
        done(err, user);
    });
});

// ===============================================
// API
// ===============================================


app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', 
        { successRedirect: '/', 
          failureRedirect: '/auth/facebook' }));

app.get('/new_session', function(request, response){
    request.session.destroy();
    send.redirect('/');
});


server.listen(port, function(){
    console.log('Listening on port ' + port);
});

io.sockets.on('connection', function(socket) {
    var session = socket.handshake.session;
    console.log(session);
    var game;
    if (session.data) {
        game = load_game(session);
    }
    else {
        game = new_game();
    }
    game.session = session;
    game.like_button.session = session;
    game.socket = socket;
    game.like_button.socket = socket;
    game.sync = function() {
        var data = { energy: this.energy };
        this.socket.emit('energy_update', data);
        this.session.data = data;
        this.session.save();
    }
    game.like_button.sync = function() {
        var data = {remaining_time: this.remaining_time()};
        this.socket.emit('like_update', data);
        var sess_like_button = {
            cooldown: this.cooldown,
            today: this.today
        }
        this.session.like_button = sess_like_button;
        this.session.save();
    }
    game.like_button.sync();
    game.sync();
    game.start_energy_growth();
    if (game.like_button.remaining_time()) {
        game.like_button.start_counter();
    }

    socket.on('click_like', function(){
        console.log("click like");
        game.add_energy(game.like_button.press_button());
        game.like_button.sync();
        game.sync();
    });

    socket.on('disconnect', function(){
        game.stop_energy_growth();
        game.like_button.stop_counter();
    });

    socket.on('purchase', function(data){
        console.log('purchase');
        var charge = {};
        charge.amount = 99; // in cents
        charge.currency = 'usd';
        charge.card = data.id;

        console.log(data);
        stripe.charges.create(charge, function(err, response){
            if (err) {
                console.log(err);
            }
            else {
                console.log("charge complete!");
                console.log(response);
                game.add_bonus('purchase');
                game.sync();
            }
        });
    })

});

function load_game(session){
    var game = Game.extend();
    game.like_button = Like_button.extend();
    if (session.like_button) {
        game.like_button.cooldown = session.like_button.cooldown;
        game.like_button.today = session.like_button.today;
    }
    game.energy = session.data.energy;
    return game;
}

function new_game(){
    var game = Game.extend();
    game.like_button = Like_button.extend();
    return game;
}
