// 888    d8P                   888     .d8888b.                                              888    
// 888   d8P                    888    d88P  Y88b                                             888    
// 888  d8P                     888    888    888                                             888    
// 888d88K     888  888 888d888 888888 888         .d88b.  88888b.  888  888  .d88b.  888d888 888888 
// 8888888b    888  888 888P"   888    888        d88""88b 888 "88b 888  888 d8P  Y8b 888P"   888    
// 888  Y88b   888  888 888     888    888    888 888  888 888  888 Y88  88P 88888888 888     888    
// 888   Y88b  Y88b 888 888     Y88b.  Y88b  d88P Y88..88P 888  888  Y8bd8P  Y8b.     888     Y88b.  
// 888    Y88b  "Y88888 888      "Y888  "Y8888P"   "Y88P"  888  888   Y88P    "Y8888  888      "Y888 
//with a C

import path from "path";
import url from "url";
import { app, BrowserWindow, Menu, webContents } from "electron";
import { devMenuTemplate } from "./menu/dev_menu_template";
import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";

var mainWindow;

// initiate IPC
const electron = require("electron");
const { ipcMain } = require('electron');
const dialog = electron.dialog;
var ffmpeg = require('fluent-ffmpeg');

if (env.name !== "production") {
    let ffmpeg_path = require('ffmpeg-static').path;
    let ffprobe_path = require('ffprobe-static').path;
    ffmpeg.setFfmpegPath(ffmpeg_path);
    ffmpeg.setFfprobePath(ffprobe_path);
} else {
    let basepath = path.join(process.env.LOCALAPPDATA, 'programs/curtconvert');
    let ffmpeg_path = path.join(basepath, 'resources/app.asar.unpacked/node_modules/ffmpeg-static/bin/win32/x64/ffmpeg.exe');
    let ffprobe_path = path.join(basepath, 'resources/app.asar.unpacked/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe');
    ffmpeg.setFfmpegPath(ffmpeg_path);
    ffmpeg.setFfprobePath(ffprobe_path);
}

// recieve source file pathname from renderer
ipcMain.on('source-files', function(event, data) {
    console.log(data, "received successfully");
    //transcode(data);
    event.sender.send('selectedfiles', data)
});

////////////////////////////////////////////////////////////////////////////////////
//								FFMPEG  									//
////////////////////////////////////////////////////////////////////////////////////
// recieve transcoding 'start' trigger from renderer
ipcMain.on('start', function(event, jobs) {
    console.log(jobs);
    for (var j of jobs) {
        if (j.hasOwnProperty('dest')) {
            transcode(j);
        }
    }
})
var proc;

function transcode(data) {
    let file = path.parse(data.file);
    let newfilename = file.name;
    switch (data.codec) {
        case 'libx264':
            newfilename += ".mp4";
            break;
        case 'libvpx':
        case 'libvpx-vp9':
            newfilename += ".webm";
            break;
    }
    proc = new ffmpeg();
    proc.addInput(data.file)
        .on('start', function(ffmpegCommand) {
            console.log('"Im starting your transcoding" -Curt');
            console.log('data.codec', data.codec);
            console.log('data.dest', `${data.dest}\\TRANSCODED-${path.basename(data.file)}`);
        })
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent + '% done');
            console.log(progress)
                //ipc_send.send('percentage', progress.percent);
                //send progress percentage to renderer:
            mainWindow.webContents.send('progress', progress.percent)
        })
        .on('end', function(stdout, stderr) {
            console.log('"Umm, I finished your transcoding" -Curt');
            //then display a success/back button to reset back to app.html
            console.log('"sending complete message to mainwindow" -Curt');
            mainWindow.webContents.send('complete');
            console.log('"complete message sent to mainwindow" -Curt');
        })
        .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
        })
        //need to make dynamic codec
        .videoCodec(data.codec)
        .outputOptions(['-vf showinfo', '-strict', '-2', '-maxrate 5000k', '-bufsize 10000k'])
        //need to make dynamic output, currently outputs to C:\Users\Chris.Connelly\electron-boilerplate\output.mp4
        //.output(data.dest + '/' + 'TRANSCODED-' + path.basename(data.file))
        .output(`${data.dest}\\TRANSCODED-${newfilename}`)
        .run();
    // end ffmpeg code //
}

ipcMain.on('kill', function(event) {
    proc.kill();
    console.log('"Why did you fake me out like that?" -Curt');
})


////////////////////////////////////////////////////////////////////////////////////
//								ELECTRON MAIN  									//
////////////////////////////////////////////////////////////////////////////////////

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
import { readFile } from "fs-extra-p";

const setApplicationMenu = () => {
    const menus = [editMenuTemplate];
    // if (env.name !== "production") {
    menus.push(devMenuTemplate);
    // }
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

    mainWindow = new BrowserWindow({
            width: 961,
            height: 437,
            frame: false,
            radii: [5, 5, 5, 5],
            transparent: true,
            icon: path.join(__dirname, '/resources/512x512.png')
        })
        //mainWindow.setResizable(false);
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "app.html"),
            protocol: "file:",
            slashes: true,
            transparent: true
        })
    );

    // if (env.name === "development") {
    // mainWindow.openDevTools();
    // }
});

app.on("window-all-closed", () => {
    app.quit();
});