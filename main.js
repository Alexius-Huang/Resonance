const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const http = require('http')
const moment = require('moment')
const fs = require('fs')
const port = 3001

let win
let ENVIRONMENT = 'development'
let $browser = {
  width: 1400, height: 900
}

function createWindow () {
  win = new BrowserWindow({ width: $browser.width, height: $browser.height })

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
  return moment().format(format || 'YYYY:MM:DD hh:mm:ss')
}

http.createServer(function(request, response) {
  console.log(`${request.method} :: http://localhost:${port}${request.url} at ${new Date()}`);
  
  function render(file) {
    fs.readFile(getHTMLFile(file), function (error, pageResponse) {
      if (error) {
        response.writeHead(404)
        response.write('Contents you are looking are Not Found')
      } else {
        console.log(`Rendering :: http://localhost:${port}${request.url}.html\n`);
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.write(pageResponse)
      }
      response.end()
    })
  }

  function jsonResponse(obj) {
    response.writeHead(200, {"Content-Type": "application/json"})
    response.end(JSON.stringify(obj))
  }

  function postRequest(request, callback) {
    var POST = {}
    request.on('data', function(data) {
      data = data.toString('utf8');
      data = data.split('&');
      for (let i = 0; i < data.length; i++) {
        var _data = data[i].split("=");
        var processed = ""
        _data[1] = _data[1].replace(/\+/g, " ")
        for (let j = 0; j < _data[1].length; j++) {
          if (_data[1][j] == '%') {
            let ascii = parseInt(_data[1].slice(j + 1, j + 3), 16)
            processed = processed.concat(String.fromCharCode(ascii))
            j += 2
          } else processed = processed.concat(_data[1][j])
        }

        POST[_data[0]] = processed;

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
      case '/upload_musics':
        postRequest(request, function(data) {
          fs.exists(__dirname + '/uploads/' + data.filename, function(exists) {
            if (exists) {
              jsonResponse({ error: 'file exists', filename: data.filename })
            } else {
              fs.createReadStream(data.filepath).pipe(fs.createWriteStream(__dirname + '/uploads/' + data.filename));
              
              let userData = parseJSONData('user')
              userData.music_count++
              userData.music_index++
              let musicIndex = userData.music_index
              
              /* Recording user and music data */
              writeJSONData('user', userData, function() {
                var musicObj = {
                  id: musicIndex,
                  name: data.filename,
                  playlistIDs: [],
                  uploaded: getCurrentTime()
                }
                musicData = parseJSONData('music')
                musicData.push(musicObj)
                writeJSONData('music', musicData, function() {
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
}).listen(port)

process.on('uncaughtException', function(err) {
  // console.log(err)
})