const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const http = require('http')
const fs = require('fs')
const port = 3001

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let ENVIRONMENT = 'development'
let $browser = {
  width: 1200, height: 900
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: $browser.width, height: $browser.height })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'public/general.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  if (ENVIRONMENT === 'development') win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function getHTMLFile(name) {
  return __dirname + '/public/' + name + '.html';
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

  if (request.method === 'GET') {
    switch(request.url) {
      case '/main': render('main'); break;
      case '/all_songs': render('all_songs'); break;
      case '/playlists': render('playlists'); break;
      case '/playing': render('playing'); break;
      case '/setting': render('setting'); break;
      case '/info': render('info'); break;
    }
  } else if (request.method === 'POST') {
    switch(request.url) {
    }
  }
}).listen(port)