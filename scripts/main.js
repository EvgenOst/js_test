(function(window) {
  'use strict';

  var App = window.App;

  window.onYouTubePlayerAPIReady = function() {
    window.player = new YT.Player('video-placeholder', {
      height: '360',
      width: '640',
      videoId: '',
      events: {
        onReady: function() {
          console.log("Плеер загружен");
          App.main();
        },
      }
    });
  }
}(window));
