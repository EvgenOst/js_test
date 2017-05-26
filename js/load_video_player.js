function onYouTubeIframeAPIReady(id, playlist) {
    player = new YT.Player('video-placeholder', {
        width: 600,
        height: 400,
        videoId: id,
        playerVars: {
            color: 'white',
            playlist: playlist
        },
        events: {
            onReady: initialize
        }
    });
}

function initialize(){

    // ��������� �������� ���������� � ���������
    updateTimerDisplay();
    updateProgressBar();

    // ����� ������� ���������
    clearInterval(time_update_interval);

    // ��������� ���������� ������� � ������� ������������
    // ������ �������.
    time_update_interval = setInterval(function () {
        updateTimerDisplay();
        updateProgressBar();
    }, 1000)

}

function updateTimerDisplay(){
    // ���������� �������� �������.
    $('#current-time').text(formatTime( player.getCurrentTime() ));
    $('#duration').text(formatTime( player.getDuration() ));
}

function formatTime(time){
    time = Math.round(time);

    var minutes = Math.floor(time / 60),
    seconds = time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}

$('#progress-bar').on('mouseup touchend', function (e) {

    // ���������� ������ �������.
    // ����� ����� � �������� = ����� ����� ����� * ( �������� ���� / 100 )
    var newTime = player.getDuration() * (e.target.value / 100);

    // ��������������� ����� � ������ �������.
    player.seekTo(newTime);

});

// ������ ������� ����� ������� � initialize()
function updateProgressBar(){
    // Update the value of our progress bar accordingly.
    $('#progress-bar').val((player.getCurrentTime() / player.getDuration()) * 100);
}

$('#play').on('click', function () {
    player.playVideo();
});

$('#pause').on('click', function () {
    player.pauseVideo();
});

$('#mute-toggle').on('click', function() {
    var mute_toggle = $(this);

    if(player.isMuted()){
        player.unMute();
        mute_toggle.text('volume_up');
    }
    else{
        player.mute();
        mute_toggle.text('volume_off');
    }
});

$('#volume-input').on('change', function () {
    player.setVolume($(this).val());
});

$('#speed').on('change', function () {
    player.setPlaybackRate($(this).val());
});