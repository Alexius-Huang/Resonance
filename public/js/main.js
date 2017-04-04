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
          $('#output').fadeIn(250, function() {
            callback.call();
          });
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

          /* Fill in partial template data */
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
      setupUploadSongsEvent();
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

/* Upload songs event */
function setupUploadSongsEvent() {
  /* CSS Animation */
  var CSS = {
    dragenter: {
      border: '2px solid hsl(210, 100%, 50%)',
      transition: '.25s'
    },
    dragover: {
      backgroundColor: 'hsl(210, 100%, 50%)',
      transition: '.25s'
    },
    drop: {
      backgroundColor: '#333',
      border: '2px dotted hsl(210, 100%, 50%)',
      transition: '.25s'
    }
  };
  var dropped = true;
  var dragDropElement = $('div#drag-and-drop-file-handler')
  dragDropElement.on('dragenter', function(event) {
    event.stopPropagation();
    event.preventDefault();
    $(this).css(CSS.dragenter);
  }).on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
    $(this).css(CSS.dragover);
  }).on('drop', function(event) {
    $(this).css(CSS.drop);
    event.preventDefault();
    var fileList = event.originalEvent.dataTransfer.files;
    
    for (var file of fileList) {
      if (file.type === 'audio/mp3') {
        $.ajax({
          type: 'POST',
          url: BASE_URL + 'upload_songs',
          data: { filename: file.name, filepath: file.path },
          cache: false,
          success: function(data) { console.log(data) }
        });
      } else console.warn('Wrong MIME format');
    }

  });
}
