var express =     require('express'),
    http =        require('http'),
    db =          require('redis-url').connect(process.env.REDISTOGO_URL),
    RedisStore =  require('connect-redis')(express),
    path =        require('path'),
    stripe =      require('stripe')(process.env['STRIPE_SECRET_DEV']),
    io =          require('socket.io');

var app = express(),
    server = http.createServer(app),
    io = io.listen(server),
    port = process.env.PORT || 5000;

app.configure(function () {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser('secret thing goes here'));
    app.use(express.session());
    app.use(express.static(path.join(__dirname, 'public')));
});

io.configure(function () {
    // heroku doesn't support websockets, so we need to use longpolling
    // https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
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
    io.sockets.emit('message', {"message": "new person is connected"});
});
