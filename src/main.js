const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const  ExcelJs  = require("exceljs");
const fs = require("fs");
const path = require("path");
const fileHandlerService = require("../dist/lib/services/fileHandler.service");
const db  = require("../dist/lib/db");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'public', 'logo'),
    webPreferences: {
      nodeIntegration: false, 
      preload: __dirname + '/preload.js', 
    },
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  db.populateLocalDB();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });


});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("processFile", async (event, filePath) => {

  try {
    let workbook = new ExcelJs.Workbook();
    const processedFile = await fileHandlerService.default.main(workbook, filePath);

    // Ask the user where to save the processed data
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Processed File',
      defaultPath: 'processed_valuta.xlsx',
      buttonLabel: 'Save',
    });
    await workbook.xlsx.writeFile(savePath.filePath);
    console.log('File saved at:', savePath);

    // Optionally, send a confirmation back to the renderer process
    event.sender.send('file-processed-and-saved', savePath);
  } catch (error) {
    console.error('Error processing file:', error);
    event.sender.send('file-processing-error', error.message);
  }

});
