var BASE_URL = 'http://127.0.0.1:3001/';
var PARTIAL_URL = BASE_URL + 'partials/';
var CURRENT_PAGE = null;
var PARTIAL_JSON = {
  _caption: {
    __title: {
      all_songs: 'all songs',
      upload_songs: 'upload songs',
      playlists: 'playlists',
      playing: 'playing',
      setting: 'setting'
    }
  }
};

function GET(page, callback) {
  /* Change Side Bar Style */
  if (CURRENT_PAGE === page) { return false; }

  $('#li-' + CURRENT_PAGE).removeClass('active');
  CURRENT_PAGE = page;
  $('#li-' + CURRENT_PAGE).addClass('active');

  $.ajax({
    url: BASE_URL + CURRENT_PAGE,
    type: 'GET',
    success: function(html) {
      $('#output').fadeOut(250, function() {
        $('#output').html(html);
        GET_PARTIALS(function() { 
          $('#output').fadeIn(250);
        });
      });
    },
    error: function() {
      console.error('Error rendering : ' + BASE_URL + CURRENT_PAGE);
    }
  });
}

function GET_PARTIALS(callback) {
  if ($('.partial').length != 0) {
    $('.partial').each(function() {
      var node = $(this);
      var partialID = node.attr('id');
      $.ajax({
        url: PARTIAL_URL + partialID,
        type: 'GET',
        success: function(html) {
          node.html(html);
          var partialData = PARTIAL_JSON[partialID];
          for (var key of Object.keys(partialData)) {
            $('#' + key).html(partialData[key][CURRENT_PAGE]);
          }
          callback.call();
        },
        error: function() {
          console.error('Error rendering : ' + PARTIAL_URL + CURRENT_PAGE);
        }
      });
    });
  } else callback.call();
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

  $('#li-all_songs').on('click', function(event) {
    event.preventDefault();
    GET('all_songs', function() {
    
    });
  });

  $('#li-upload_songs').on('click', function(event) {
    event.preventDefault();
    GET('upload_songs', function() {
    
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