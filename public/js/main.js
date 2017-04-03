var BASE_URL = 'http://127.0.0.1:3001';
var CURRENT_PAGE = 'main';

function GET(page, callback) {
  /* Change Side Bar Style */
  $('#li-' + CURRENT_PAGE).removeClass('active');
  CURRENT_PAGE = page;
  $('#li-' + CURRENT_PAGE).addClass('active');

  $.ajax({
    url: BASE_URL + '/' + CURRENT_PAGE,
    type: 'GET',
    success: function(html) {
      $('#output').fadeOut(250, function() {
        $('#output').html(html);
        $('#output').fadeIn(250);
      });
    }
  });
}

function init() {
  $('#li-main').addClass('active');
  GET('main', function() {

  });
}

$(document).ready(function() {
  init();

  $('#li-main').on('click', function(event) {
    event.preventDefault();
    GET('main', function() {

    });
  });

  $('#li-header').on('click', function(event) {
    event.preventDefault();
    GET('info', function() {

    });
  });

  $('#li-all-songs').on('click', function(event) {
    event.preventDefault();
    GET('all_songs', function() {
    
    });
  });
  
  $('#li-playlists').on('click', function(event) {
    event.preventDefault();
    GET('playlists', function() {
    
    });
  });
  
  $('#li-playing').on('click', function(event) {
    event.preventDefault();
    GET('playing', function() {
    
    });
  });
  
  $('#li-setting').on('click', function(event) {
    event.preventDefault();
    GET('setting', function() {
    
    });
  });
  
  $('#li-info').on('click', function(event) {
    event.preventDefault();
    GET('info', function() {
      
    });
  });
});