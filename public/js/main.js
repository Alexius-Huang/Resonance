var BASE_URL = 'http://127.0.0.1:3001/';
var PARTIAL_URL = BASE_URL + 'partials/';
var CURRENT_PAGE = null;
var DATETIME_FORMAT = 'YYYY-MM-DD hh:mm:ss'
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
var ALL_MUSICS = []
var ALL_MUSIC_NODES = []
var RECENTLY_UPLOADED = []
var RECENTLY_UPLOADED_NODES = []

/* Audio params */
var $audio = null;
var $audio_source = null;
var $audio_player_footer = null;
var $audio_player_gradient_bg = null;

/* ---------------------- HTTP Request Helpers --------------------- */
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

  function REQUEST_PARTIAL(partial, data, attributes, callback) {
    var resultNode = document.createElement('div');
    for (var key of Object.keys(attributes)) {
      resultNode.setAttribute(key, attributes[key]);
    }

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
/* ---------------------- HTTP Request Helpers --------------------- */

/* ------------------------------ Helper Functions --------------------------- */
  function getMusicFiles(callback) {
    $.ajax({
      url: BASE_URL + 'get_musics',
      type: 'POST',
      dataType: 'json',
      cache: false,
      success: function(data) { callback(data) }
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
/* ------------------------------ Helper Functions --------------------------- */

/* ------------------------------ Initializations --------------------------- */
  /* Initialize when opening the app */
  function init() {
    initializeServerSide(function() {
      /* Init params */
      $audio = document.getElementById('audio');
      $audio_source = document.getElementById('audio-source');
      $audio_player_footer = document.getElementById('audio-player-footer');
      $audio_player_gradient_bg = document.getElementById('audio-player-gradient-bg');

      /* Get main page */
      $('#li-main').addClass('active');
      GET('main', function() {
        setupConditionalHidePlayerFooterEvent();

        getMusicFiles(function(data) {
          var oneDayAgo = moment().subtract(1, 'day').format(DATETIME_FORMAT);
          
          ALL_MUSICS = data;
          RECENTLY_UPLOADED = data.filter(function(data) { return oneDayAgo < data.uploaded });

          initializeAllMusicNodes();
          initializeRecentUploadedNodes();
        })
      });
    });
  }

  function initializeServerSide(callback) {
    $.ajax({
      url: BASE_URL + 'init_server',
      type: 'POST',
      cache: false,
      data: {},
      success: function() { callback.call() },
      error: function() { console.error('server error'); }
    });
  }

  function initializeAllMusicNodes(test) {
    if (test) console.log('all music node init');
    if (ALL_MUSICS.length != 0) {
      function recursivelyAppendPartial(count) {
        var music = ALL_MUSICS[count - 1];
        var html = REQUEST_PARTIAL('music', { musicname: music.name },
        {
          class: 'music',
          id: 'music' + music.id
        }, function(html) {
          ALL_MUSIC_NODES.push(html);
          if (CURRENT_PAGE === 'all_musics') {
            // $('#recent-uploads').prepend(html);
            // $('#file-' + music.id).slideDown(500);
          }
          
          /* Setup Audio Play Events */
          setupAudioPlayEvent(html, music);

          /* If file count isn't 0, keep uploading! */
          if (--count !== 0) recursivelyAppendPartial(count);
          if (test) console.log(ALL_MUSIC_NODES)
        });
      }
      recursivelyAppendPartial(ALL_MUSICS.length)
    }
  }

  function initializeRecentUploadedNodes() {
    if (RECENTLY_UPLOADED.length != 0) {
      function recursivelyAppendPartial(count) {
        var music = RECENTLY_UPLOADED[count - 1];
        var html = REQUEST_PARTIAL('upload_info', {
          filename: music.name,
          uploaded: 'Uploaded at ' + music.uploaded
        }, {
          class: 'upload-info',
          id: 'file-' + music.id 
        }, function(html) {
          RECENTLY_UPLOADED_NODES.push(html)
          
          if (CURRENT_PAGE === 'upload_musics') {
            $('#recent-uploads').prepend(html);
            $('#file-' + music.id).slideDown(500);
          }
          /* If file count isn't 0, keep uploading! */
          if (--count !== 0) recursivelyAppendPartial(count);
        });
      }
      recursivelyAppendPartial(RECENTLY_UPLOADED.length)
    }
  }

/* ------------------------------ Initializations --------------------------- */

/* -------------------------------- Audio Events ------------------------------ */

  function setupAudioPlayEvent(html, music) {
    $(html).on('click', function(event) {
      $.ajax({
        type: 'POST',
        url: BASE_URL + 'get_music_path',
        data: { id: music.id },
        cache: false,
        success: function(filepath) {
          $audio_source.setAttribute('src', filepath);
          $audio.load();
          $audio.play();
        },
        error: function() { console.warn('Could not find the filepath'); }
      })
    });
  }

/* -------------------------------- Audio Events ------------------------------ */

/* -------------------------------- Style Events ------------------------------ */

  function setupConditionalHidePlayerFooterEvent() {
    $('ul.nav-list > li').on('click', function(event) {
      if (CURRENT_PAGE === 'main' || CURRENT_PAGE === 'info') {
        if ($audio_player_footer.style.display != 'none') {
          $($audio_player_footer).fadeOut(250);
          $($audio_player_gradient_bg).fadeOut(250);
        }
      } else if ($audio_player_footer.style.display == 'none') {
        $($audio_player_footer).fadeIn(250);
        $($audio_player_gradient_bg).fadeIn(250);
      }
    });
  }

/* -------------------------------- Style Events ------------------------------ */

/* --------------------------------- Page Events ------------------------------ */
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
        displayAllMusics();
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
/* --------------------------------- Page Events ------------------------------ */

/* --------------------------------- Page Methods ------------------------------ */

  function displayAllMusics() {
    if (ALL_MUSIC_NODES.length != 0) {
      function displayNodeRecursively(count) {
        var node = ALL_MUSIC_NODES[count - 1];
        $('#all-musics').append(node);
        node.style.display = 'none';
        $(node).fadeIn(250, function() {
          if (--count != 0) displayNodeRecursively(count);
        });
      }
      displayNodeRecursively(ALL_MUSIC_NODES.length);
      // for (var node of ALL_MUSIC_NODES) {
      //   node.style.display = 'none';
      //   $('#all-musics').append(node);
      //   $(node).fadeIn(500);
      // }
    } else return false;
  }

  function displayRecentlyUploadedMusic() {
    if (RECENTLY_UPLOADED_NODES.length != 0) {
      for (var node of RECENTLY_UPLOADED_NODES) {
        if (node.style.display) { node.style.display = 'none'; }
        $('#recent-uploads').append(node);
        $(node).fadeIn(500);
      }
    } else return false;
  }

  function updateAllMusics() {
    console.log('updating...')
    $.ajax({
      url: BASE_URL + 'update_all_musics',
      type: 'POST',
      data: {},
      dataType: 'json',
      cache: false,
      success: function(result) {
        ALL_MUSICS = result;
        for (var html of ALL_MUSIC_NODES) { $(html).unbind(); }
        ALL_MUSIC_NODES = []
        initializeAllMusicNodes(true);
      },
      error: function() { console.error('Cannot update the "ALL_MUSICS" params'); }
    })
  }

/* --------------------------------- Page Methods ------------------------------ */

/* ---------------------------- Upload Musics Event -------------------------- */
  
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
      dragDropElement.unbind();
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
                }, {
                  class: 'upload-info',
                  id: 'file-' + data.id
                }, function(html) {
                  RECENTLY_UPLOADED_NODES.push(html);

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
        if (--count != 0) {
          setTimeout(function() { uploadFile(count) }, 500);
        } else {
          if (duplicatedFiles.length != 0) {
            console.warn('should display duplicated files')
          }
          doneUpload();
        }
        return count;
      }

      function doneUpload() {
        /* Update all musics */
        updateAllMusics();
        
        /* Reset drag and drop element event */
        dragDropElement.unbind();
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

      /* Recursively upload files synchronously */
      uploadFile(fileList.length);

    });
  }

/* ---------------------------- Upload Musics Event -------------------------- */