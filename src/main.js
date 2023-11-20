const { app, BrowserWindow, ipcMain } = require('electron');
const  ExcelJs  = require("exceljs");
const fs = require("fs");
const fileHandlerService = require("../dist/lib/services/fileHandler.service");

//populateLocalDB()
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // This is important to disable nodeIntegration in the renderer process
      preload: __dirname + '/preload.js', // Path to preload script
    },
  });

  mainWindow.loadFile('../index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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
    // Communicate with the additional service for processing
    let workbook = new ExcelJs.Workbook();
    const processedFile = await fileHandlerService.default.main(workbook, filePath);

    // Ask the user where to save the processed data
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Processed File',
      defaultPath: 'proce',
      buttonLabel: 'Save',
    });

    // Save the processed data to the selected location
    // (You need to implement the actual saving logic based on your use case)
    // For example:
    fs.writeFileSync(savePath, processedData);

    console.log('File saved at:', savePath);

    // Optionally, you can send a confirmation back to the renderer process
    event.sender.send('file-processed-and-saved', savePath);
  } catch (error) {
    console.error('Error processing file:', error);
    // Optionally, send an error message back to the renderer process
    event.sender.send('file-processing-error', error.message);
  }

});
