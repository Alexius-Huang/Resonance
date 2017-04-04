var BASE_URL = 'http://127.0.0.1:3001/';
var PARTIAL_URL = BASE_URL + 'partials/';
var CURRENT_PAGE = null;
var PARTIAL_JSON = {
  _caption: {
    __title: {
      all_musics: 'all musics',
      upload_musics: 'upload musics',
      playlists: 'playlists',
      playing: 'playing',
      setting: 'setting'
    }
  }
};
var RECENTLY_UPLOADED = []

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

function REQUEST_PARTIAL(partial, data, classname, callback) {
  var resultNode = document.createElement('div');
  resultNode.className = classname;

  $.ajax({
    url: BASE_URL + 'partial',
    type: 'POST',
    data: { partial: partial },
    cache: false,
    success: function(html) {
      resultNode.innerHTML = html
      
      for (var key of Object.keys(data)) {
        resultNode.getElementsByClassName('__' + key)[0].innerHTML = data[key];
      }

      callback(resultNode);
    }
  });
}

function init() {
  $('#li-main').addClass('active');
  GET('main', function() {

  });
}

function disableNavBar() {
  var shade = document.createElement('div');
  shade.style.height = '100vh';
  shade.style.width = '210px';
  shade.style.position = 'fixed';
  shade.style.left = 0;
  shade.style.top = 0;
  shade.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  shade.style.zIndex = 2;
  shade.setAttribute('id', 'disable-nav-shade');
  document.body.appendChild(shade);
}

function enableNavBar() {
  var shade = document.getElementById('disable-nav-shade')
  shade.parentNode.removeChild(shade);
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

  $('#li-all_musics').on('click', function(event) {
    event.preventDefault();
    GET('all_musics', function() {
    
    });
  });

  $('#li-upload_musics').on('click', function(event) {
    event.preventDefault();
    GET('upload_musics', function() {
      displayRecentlyUploadedMusic();
      setupUploadMusicsEvent();
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


function displayRecentlyUploadedMusic() {
  if (RECENTLY_UPLOADED.length != 0) {
    for (var node of RECENTLY_UPLOADED) {
      if (node.style.display) { node.style.display = 'none'; }
      $('#recent-uploads').append(node);
      $(node).fadeIn(500);
    }
  } else return false;
}

/* Upload musics event */
function setupUploadMusicsEvent() {
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
    
    disableNavBar();
    dragDropElement.on('dragenter dragover drop', function(event) { event.preventDefault(); })
    dragDropElement.css({
      transition: '.25s',
      backgroundColor: 'hsl(0, 100%, 60%)',
      borderColor: 'hsl(0, 100%, 60%)',
      boxShadow: '10px 10px 15px rgba(255, 100, 100, 0.2)',
      cursor: 'wait'
    });
    $('#drag-and-drop-file-handler > p')[0].innerHTML = 'Please wait while MP3 uploading ...';

    var duplicatedFiles = [];
    function uploadFile(count) {
      let file = fileList[count - 1]; 
      if (file.type === 'audio/mp3') {
        $.ajax({
          type: 'POST',
          url: BASE_URL + 'upload_musics',
          data: { filename: file.name, filepath: file.path },
          cache: false,
          dataType: 'json',
          success: function(data) {
            if (data.error === 'file exists') {
              duplicatedFiles.push(data.filename)
              /* If file count isn't 0, keep uploading! */
              recursivelyUpload(count);
            } else {
              /* Create Element */
              var html = REQUEST_PARTIAL('upload_info', {
                filename: data.filename,
                uploaded: 'Uploaded at ' + data.uploaded
              },'upload-info', function(html) {
                html.setAttribute('id', 'file-' + data.id);
                RECENTLY_UPLOADED.push(html)

                if (CURRENT_PAGE === 'upload_musics') {
                  $('#recent-uploads').prepend(html);
                  $('#file-' + data.id).slideDown(500);
                }
                /* If file count isn't 0, keep uploading! */
                recursivelyUpload(count);
              });
            }
          }
        });
      } else {
        console.warn('Wrong MIME format');
        /* If file count isn't 0, keep uploading! */
        recursivelyUpload(count);
      }
    }

    function recursivelyUpload(count) {
      count--;
      if (count != 0) {
        setTimeout(function() { uploadFile(count) }, 500);
      } else {
        if (duplicatedFiles.length != 0) {
          console.warn('should display duplicated files')
        }
        setupUploadMusicsEvent();
        enableNavBar();
        dragDropElement.css({
          border: '2px dotted hsl(210, 100%, 50%)',
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#333',
          cursor: 'default',
        });
        $('#drag-and-drop-file-handler > p')[0].innerHTML = 'Drag & Drop your MP3 Files and Upload';
      }
      return count
    }

    /* Recursively upload files synchronously */
    uploadFile(fileList.length);

  });
}
