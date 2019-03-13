// 888    d8P                   888     .d8888b.                                              888    
// 888   d8P                    888    d88P  Y88b                                             888    
// 888  d8P                     888    888    888                                             888    
// 888d88K     888  888 888d888 888888 888         .d88b.  88888b.  888  888  .d88b.  888d888 888888 
// 8888888b    888  888 888P"   888    888        d88""88b 888 "88b 888  888 d8P  Y8b 888P"   888    
// 888  Y88b   888  888 888     888    888    888 888  888 888  888 Y88  88P 88888888 888     888    
// 888   Y88b  Y88b 888 888     Y88b.  Y88b  d88P Y88..88P 888  888  Y8bd8P  Y8b.     888     Y88b.  
// 888    Y88b  "Y88888 888      "Y888  "Y8888P"   "Y88P"  888  888   Y88P    "Y8888  888      "Y888 

import path from "path";
import url from "url";
import { app, BrowserWindow, Menu } from "electron";
import { devMenuTemplate } from "./menu/dev_menu_template";
import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";
var ffmpeg = require('fluent-ffmpeg');

// initiate IPC
const electron = require("electron");
const ipc_send = electron.ipcRenderer;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

// recieve source file pathname from renderer
ipc.on('source-files', function(event, data){
  console.log(data, "received successfully");
  //transcode(data);
  event.sender.send('selectedfiles', data)
});

// recieve transcoding 'start' trigger from renderer
ipc.on('start', function(event, transcode){
  transcode(data);
})

////////////////////////////////////////////////////////////////////////////////////
//								TRANSCODING  									//
////////////////////////////////////////////////////////////////////////////////////
function transcode(data){
  
  var proc = new ffmpeg();
  proc.addInput(data)
  .on('start', function(ffmpegCommand) {
    console.log('"Im starting your transcoding" -Kurt');
  })
  .on('progress', function(progress) {
    console.log('Processing: ' + progress.percent + '% done');
    //ipc_send.send('percentage', progress.percent);
  })
  .on('end', function(stdout, stderr) {
    console.log('"Umm, I finished your transcoding" -Kurt');
  })
  .on('error', function(err, stdout, stderr) {
    console.log('Cannot process video: ' + err.message);
  })
  //need to make dynamic codec
  .videoCodec('libx264')
  .outputOptions(['-vf showinfo', '-strict', '-2', '-maxrate 5000k', '-bufsize 10000k'])
  //need to make dynamic output, currently outputs to C:\Users\Chris.Connelly\electron-boilerplate\output.mp4
  ipcMain.on('selectedfolderpath', function(folderNames){
  console.log('folder name received by ffmpeg: ' + folderNames);
  })  
  .output(folderNames + 'bunnyoutput.mp4')
  .run(); 
  // end ffmpeg code //
}
////////////////////////////////////////////////////////////////////////////////////
//								ELECTRON MAIN  									//
////////////////////////////////////////////////////////////////////////////////////

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
import { readFile } from "fs-extra-p";

const setApplicationMenu = () => {
  const menus = [editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

app.on("ready", () => {
  setApplicationMenu();

  /* const mainWindow = createWindow("main", {
    maxWidth: 1280,
    maxHeight: 1080,
    frame: false,
  }); */

  let mainWindow = new BrowserWindow({
    width: 980,
    height: 460,
    frame: false,
  })
  //mainWindow.setResizable(false);
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

 // if (env.name === "development") {
   // mainWindow.openDevTools();
 // }
});

app.on("window-all-closed", () => {
  app.quit();
});