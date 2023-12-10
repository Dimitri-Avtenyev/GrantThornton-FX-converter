const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const  ExcelJs  = require("exceljs");
const fs = require("fs");
const path = require("path");
const fileHandlerService = require("../dist/lib/services/fileHandler.service");
const { setLocalDataPath } = require("../dist/lib/services/datastorage.service");
const db  = require("../dist/lib/db");

const nativeImage = require("electron").nativeImage;
const macosIcon = nativeImage.createFromPath(path.join(__dirname,"..", "public", "logo.png"));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname,"..", "public", "logo.png"),
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

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(macosIcon);
  };

  initializePaths();
  await db.populateLocalDB();

  createWindow();
  
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


function initializePaths () {
  const userDataPath = app.getPath("userData");
  const localDataPath = path.join(userDataPath, "localData");
  if (!fs.existsSync(localDataPath)) {
    console.log("No folder present, creating...");
    fs.mkdirSync(localDataPath);
  }
  console.log("Folder already exists, continue...");
  setLocalDataPath(localDataPath);

}