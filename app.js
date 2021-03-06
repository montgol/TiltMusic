var express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser');

var app = express();
var routes = require('./routes');
var config = require('./.config');

app.set('views', path.join(__dirname, 'views'));

//use stuff
app.use(logger('dev'));
app.use(bodyParser.json()); //not sure if we'll explicityl need this, but... meh
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.get('/',function(req,res,next){
    res.sendFile(__dirname+ '/views/index.html');
});


var http = require('http').Server(app);
var io = require('socket.io')(http);
var allUserNames = []; //array of strings, each holding an incoming ip. 
//These are used as 'usernames', and each is associated with ONE oscillator instance
var allOscs = []; //array of objects. These hold multiple oscillator
//info bits of the format: {ip: 1.2.3.4, freq}

io.on('connection', function(socket) {
    var name = socket.handshake.address; //get incoming client a dress.
    if (allUserNames.indexOf(name) == -1) {
        //new user!
        allUserNames.push(name); //store usernamex

        allOscs[allOscs.length] = {
            ip: name,
            osc: 440,
            timeLord: new Date().valueOf()
        }; //create new 'player'. default freq is 440hz
        console.log('new player info: ', allOscs[allOscs.length - 1]);
    } else {
        //old user. do nothing
    }
    socket.on('userSoundToServer', function(pitch) {
        /*we get an input from a user. PLAN:
        1) store user's IP (ipInc)
        2) check against allUsers IP
        */
        var ipInc = socket.handshake.address;
        //there's gotta be a faster way to do this!
        var allFreqs = [];
        var timeyWimey = new Date().valueOf();
        for (var i = 0; i < allOscs.length; i++) {
            //loop thru all users. Change target user, then build
            //freq list for all users.

            if (allOscs[i].ip == ipInc) {
                //found the user, so change their frequency!
                var pitchStep = Math.floor(pitch / 5) * 5; //this basically just moves the pitch by certain 'steps'.
                var adjPitchServ = 50 + parseInt(pitchStep * 5);
                allOscs[i].osc = adjPitchServ;
                allOscs[i].timeLord = new Date(); //update this user's most recent contribution
                allFreqs.push(allOscs[i].osc)
            } else if ((timeyWimey - allOscs[i].timeLord) > 60000) {
                //been 60 sec since this person last contributed. they may be dead.
                //EXTERMINATE!
                allOscs.splice(i, 1);
                allUserNames.splice(i, 1);
            } else {
                allFreqs.push(allOscs[i].osc);
            }
        }
        io.emit('soundPitch', allFreqs); //the array of freqs!
    });
    //disconnect seems to not work. It seems that the disconnect happens BEFORE
    //the user's IP can be sent. should we just set this to a setTimeout event,
    //where the user is 'deleted' after a certain period of inactivity?

});


 http.listen(3000, config.ip ) // MAKE SURE THIS REFLECTS YOUR SERVER OR IT WONT WORK I.E. 192.168.1.94:3000 vs localhost...



app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message,
        error: {}
    });
});

