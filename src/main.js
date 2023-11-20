const { app, BrowserWindow, ipcMain } = require('electron');

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
  // try {
  //   const result = await processExcelFile(filePath);
  //   event.sender.send('excel-file-processed', result);
  // } catch (error) {
  //   console.error('Error processing Excel file:', error);
  //   event.sender.send('excel-file-processed', []);
  // }
});
