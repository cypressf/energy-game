var express =     require('express'),
    http =        require('http'),
    db =          require('redis-url').connect(process.env.REDISTOGO_URL),
    redis_store = require('connect-redis')(express),
    io_session =  require('socket.io-session'),
    path =        require('path'),
    stripe =      require('stripe')(process.env['STRIPE_SECRET_DEV']),
    io =          require('socket.io'),
    Game =        require('./game'),
    Like_button = require('./like_button');

var app = express(),
    server = http.createServer(app),
    io = io.listen(server),
    session_store = new redis_store({client:db});
    port = process.env.PORT || 5000;

app.configure(function () {
    // app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', store: session_store, cookie: { maxAge: 30*1000*60*60*24 }}));
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


// ===============================================
// API
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
