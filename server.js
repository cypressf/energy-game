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
    app.use(express.session({secret: 'secret', store: session_store, cookie: { maxAge: 1000*60*60*14 }}));
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
        game = load_game(session.data);
    }
    else {
        game = new_game();
    }
    game.session = session;
    game.socket = socket;
    game.sync = function() {
        var data = {
            energy: this.energy,
            energy_grow_rate: this.energy_grow_rate,
            bonus: this.bonus
        }
        this.socket.emit('energy_update', data);
        this.session.data = data;
        this.session.save();
    }
    game.sync();
    game.start_energy_growth();
    socket.emit('like_update', {'remaining_time': 60*1000*60});

    socket.on('disconnect', function(){
        game.stop_energy_growth();
    })
});

function load_game(data){
    var game = Game.extend();
    game.energy = data.energy;
    game.energy_grow_rate = data.energy_grow_rate;
    game.bonus = data.bonus;
    return game;
}

function new_game(){
    var game = Game.extend();
    return game;
}
