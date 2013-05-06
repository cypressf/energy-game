var express =     require('express'),
    http =        require('http'),
    db =          require('redis-url').connect(process.env.REDISTOGO_URL),
    redis_store = require('connect-redis')(express),
    io_session =  require('socket.io-session'),
    path =        require('path'),
    stripe =      require('stripe')(process.env['STRIPE_SECRET_DEV']),
    io =          require('socket.io');

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
    console.log(socket.handshake.sessionId);
    console.log(session);
    if (session.name) {
        socket.emit('update', {"message": "hi " + session.name});
    }
    socket.on('update', function(data){
        if (data.name) {
            session.name = data.name;
            session.save();
        }
        console.log(session);
        socket.emit('update', {"message": "received " + session.name});
    });
});
