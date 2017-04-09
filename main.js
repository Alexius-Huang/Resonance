const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const http = require('http')
const moment = require('moment')
const GIS = require('g-i-s');
const fs = require('fs')
const port = 3001

let win
let ENVIRONMENT = 'development'
let $browser = {
  width: 1400,
  height: 900,
  minWidth: 660,
  minHeight: 600
}

function createWindow () {
  win = new BrowserWindow($browser)

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'public/general.html'),
    protocol: 'file:',
    slashes: true
  }))

  if (ENVIRONMENT === 'development') win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

function getHTMLFile(name) {
  return __dirname + '/public/' + name + '.html'
}

function getJSONFile(name) {
  return __dirname + '/data/' + name + '.json'
}

function parseJSONFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function parseJSONData(type) {
  return parseJSONFile(getJSONFile(type))
}

function writeJSONFile(filename, json, callback) {
  fs.writeFile(filename, JSON.stringify(json, null, 2), 'utf8', callback)
}

function writeJSONData(type, json, callback) {
  writeJSONFile(getJSONFile(type), json, callback)
}

function getCurrentTime(format) {
  return moment().format(format || 'YYYY-MM-DD hh:mm:ss')
}

function decodeASCII(string) {
  var processed = ""
  for (let j = 0; j < string.length; j++) {
    if (string[j] == '%') {
      let ascii = parseInt(string.slice(j + 1, j + 3), 16)
      processed = processed.concat(String.fromCharCode(ascii))
      j += 2
    } else processed = processed.concat(string[j])
  }
  return processed;
}

let ALL_MUSICS;
let ALL_MUSIC_COVERS;

const SERVER = http.createServer(function(request, response) {
  console.log(`${request.method} :: http://localhost:${port}${request.url} at ${new Date()}`);

  function notFoundResponse(text) {
    response.writeHead(404)
    response.write(text || 'Contents you are looking are Not Found')
  }

  function jsonResponse(obj) {
    response.writeHead(200, {"Content-Type": "application/json"})
    response.end(JSON.stringify(obj))
  }

  function plainResponse(text) {
    response.writeHead(200, {"Content-Type": "text/plain"})
    response.end(text)
  }

  function getUser() {
    return parseJSONData('user')
  }

  function updateUser(userData, callback) {
    writeJSONData('user', userData, function() {
      callback();
    })
  }

  function getAllMusic() {
    return parseJSONData('music')
  }

  function getMusic(id) {
    return (getAllMusic().filter(function(music) { return music.id == id })[0])
  }

  function updateAllMusic(musicData, callback) {
    writeJSONData('music', musicData, function() {
      callback()
    })
  }

  function getAllMusicCover() {
    return parseJSONData('music_cover')
  }

  function getMusicCover(music_id) {
    return (getAllMusicCover().filter(function(cover) { return cover.enabled && cover.music_id == music_id })[0])
  }

  function updateAllMusicCover(musicCoverData, callback) {
    writeJSONData('music_cover', musicCoverData, function() {
      callback()
    })
  }

  function save_music_cover(music_id, callback) {
    let music = getMusic(music_id);
    GIS(music.name, function(error, results) {
      if (error) { notFoundResponse(error) } else {
        let userData = getUser()
        let musicCoverData = getAllMusicCover()
        let savedCoverData = []
        let currentCoverData = null;
        let count = 1;
        let coverData;
        for (let coverData of results) {
          if (coverData.width === coverData.height) {
            userData.music_cover_count++
            userData.music_cover_index++
            coverData = {
              id: userData.music_cover_index,
              music_id: music_id,
              url: coverData.url,
              enabled: count === 1,
              size: coverData.width
            };
            
            savedCoverData.push(coverData)

            if (count === 1) currentCoverData = coverData

            count++;
          }

          if (count > 5) break;
        }
        musicCoverData = musicCoverData.concat(savedCoverData)
        updateUser(userData, function() {
          updateAllMusicCover(musicCoverData, function() {
            callback(currentCoverData)
          })
        })
      }
    });
  }

  function render(file) {
    fs.readFile(getHTMLFile(file), function (error, pageResponse) {
      if (error) { notFoundResponse(error) } else {
        console.log(`Rendering :: http://localhost:${port}${request.url}.html\n`);
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.write(pageResponse)
      }
      response.end()
    })
  }

  function postRequest(request, callback) {
    var POST = {}
    request.on('data', function(data) {
      data = data.toString('utf8');
      data = data.split('&');
      for (let i = 0; i < data.length; i++) {
        var _data = data[i].split("=")
        _data[1] = _data[1].replace(/\+/g, " ")
        
        POST[_data[0]] = decodeASCII(_data[1]);

        console.log(`POST :: "${_data[0]}": "${POST[_data[0]]}"`)
      }
    })
    request.once('end', function() {
      console.log("")
      callback(POST)
    })
  }

  if (request.method === 'GET') {
    switch(request.url) {
      case '/main': render('main'); break;
      case '/all_musics': render('all_musics'); break;
      case '/upload_musics': render('upload_musics'); break;
      case '/playlists': render('playlists'); break;
      case '/playing': render('playing'); break;
      case '/setting': render('setting'); break;
      case '/info': render('info'); break;
      default: render(request.url.slice(1)); // <= Render Partials
    }
  } else if (request.method === 'POST') {
    switch(request.url) {
      case '/init_server':
        postRequest(request, function(data) {
          ALL_MUSICS = getAllMusic()
          ALL_MUSIC_COVERS = getAllMusicCover()
          plainResponse('success')
        })
        break;

      case '/get_musics':
        postRequest(request, function(data) {
          jsonResponse(ALL_MUSICS)
        })
        break;

      case '/get_music_path':
        postRequest(request, function(data) {
          plainResponse(`file://${__dirname}/public/music/${getMusic(data.id).name}`)
        })
        break;
      
      case '/update_all_musics':
        postRequest(request, function(data) {
          ALL_MUSICS = getAllMusic()
          jsonResponse(ALL_MUSICS)
        })
        break;
      
      case '/get_music_cover':
        postRequest(request, function(data) {
          // search_music_cover(data.id, function(results) {
            
          // })
          plainResponse('TESTING')
        })
        break;

      case '/save_music_cover':
        postRequest(request, function(data) {
          save_music_cover(data.music_id, function(coverData) {
            jsonResponse(coverData)
          })
        })
        break;

      // case '/search_image':
      //   postRequest(request, function(data) {
      //     search_image(data.src, function(results) {
      //       jsonResponse(results)
      //     })
      //   })
      //   break;

      case '/upload_musics':
        postRequest(request, function(data) {
          fs.exists(__dirname + '/public/music/' + data.filename, function(exists) {
            if (exists) {
              jsonResponse({ error: 'file exists', filename: data.filename })
            } else {
              fs.createReadStream(data.filepath).pipe(fs.createWriteStream(__dirname + '/public/music/' + data.filename));
              
              let userData = getUser();
              userData.music_count++
              userData.music_index++
              let musicIndex = userData.music_index
              
              /* Recording user and music data */
              updateUser(userData, function() {
                let musicObj = {
                  id: musicIndex,
                  name: data.filename,
                  playlistIDs: [],
                  uploaded: getCurrentTime()
                }
                musicData = getAllMusic()
                musicData.push(musicObj)
                updateAllMusic(musicData, function() {
                  ALL_MUSICS = JSON.parse(JSON.stringify(musicData));
                  data.id = musicObj.id
                  data.message = 'Success Uploading'
                  data.uploaded = musicObj.uploaded
                  jsonResponse(data)
                })
              })
            }
          })
        })
        break;

      case '/partial':
        postRequest(request, function(data) {
          render(`partials/_${data.partial}`)
        })
        break;
    }
  }
})

SERVER.on('listening', function() {
  console.log(`Okay! Resonance Server Running on Port ${port}\n`)
})

SERVER.listen(port)

// process.on('uncaughtException', function(err) {
//   console.log(err)
// })