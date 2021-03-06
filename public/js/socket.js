var socket = io();
var oscList = []; //array of oscillators!
var allPlayin = false; //we makin sweet, sweet music?

// var soundies = new OscillatorSample();//initialize an instance of the sound thingy. We may need to do this multiple times per user eventually.
// //Can we use multiple oscillators per audiocontext? Or just one?
window.addEventListener('deviceorientation', function(e) {
    var pitch = Math.floor((Math.max(0, Math.min(e.beta, 90)) / 90) * 360)
    socket.emit('userSoundToServer', pitch);
    $('#freqMon').val(pitch);
})
socket.on('soundPitch', function(allFreqs) {
    //gotta rewrite this as a foreach for each separate osc.
    while (oscList.length != allFreqs.length) {
        //while loopz to adjust oscList length
        if (oscList.length < allFreqs.length) {
            //need moar!
            oscList.push(new OscillatorSample());
        } else if (oscList.length > allFreqs.length) {
            oscList.pop();
        }
    }
        //we now have exactly the same amount of oscillators as users.
    for (var i = 0; i < allFreqs.length; i++) {
        if (oscList[i] && oscList[i].isPlaying) {
            oscList[i].changeFrequency(allFreqs[i]); //adjust all oscillator freqs
        }
    }
    angular.element($('#angMain')).scope().freqShow(allFreqs);
});

function toggleAll() {
    console.log('Toggling play active!');
    (allPlayin) ? allPlayin = false: allPlayin = true;
    for (var i = 0; i < oscList.length; i++) {
        if (allPlayin) {
            oscList[i].play();
            oscList[i].isPlaying = true;
            $('#play-pause').html("Pause &nbsp; &#9612; &#9612;").addClass("btn-info");
        } else {
            oscList[i].stop();
            oscList[i].isPlaying = false;
            $('#play-pause').html("Play &nbsp; &#9654;").removeClass("btn-info");
        }
    }
}