const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const ExcelJs = require('exceljs');
const fs = require('fs');
const path = require('path');
const fileHandlerService = require('../dist/lib/services/fileHandler.service');
const {
  setLocalDataPath,
} = require('../dist/lib/services/datastorage.service');
const db = require('../dist/lib/db');

const nativeImage = require('electron').nativeImage;
const macosIcon = nativeImage.createFromPath(
  path.join(__dirname, '..', 'public', 'logo.png'),
);

let mainWindow;
let loadingWindow;
let errorNetworkWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
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
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js',
    },
  });

  loadingWindow.loadFile(
    path.join(__dirname, 'views', 'loading', 'loading.html'),
  );

  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}
function createErrorNetworkWindow() {
  errorNetworkWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js',
    },
  });

  errorNetworkWindow.loadFile(
    path.join(__dirname, 'views', 'connectionError', 'connectionError.html'),
  );

  errorNetworkWindow.on('closed', () => {
    errorNetworkWindow = null;
  });
}
async function checkConnectionAndShowView() {
  if (!net.isOnline()) {
    if (errorNetworkWindow) {
      console.log('window already exists');
    } else {
      createErrorNetworkWindow();
    }
  } else {
    if (errorNetworkWindow) {
      errorNetworkWindow.close();
    }
    createLoadingWindow();
    await db.populateLocalDB();
    loadingWindow.close();
    createWindow();
  }
}
app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(macosIcon);
  }
  // create needed paths in userData then populate local json file
  initializePaths();

  checkConnectionAndShowView();

  app.on('activate', () => {
    if (mainWindow === null) {
      checkConnectionAndShowView();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('processFile', async (event, filePath) => {
  try {
    let workbook = new ExcelJs.Workbook();
    const processedFile = await fileHandlerService.default.main(
      workbook,
      filePath,
    );

    // Ask the user where to save the processed data
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Processed File',
      defaultPath: 'processed_valuta.xlsx',
      buttonLabel: 'Save',
    });
    if (savePath.canceled) {
      event.sender.send('resetMessage');
    }
    await workbook.xlsx.writeFile(savePath.filePath);
    console.log('File saved at:', savePath);

    // Optionally, send a confirmation back to the renderer process
    event.sender.send('file-processed-and-saved', savePath);
    event.sender.send('resetMessage');
  } catch (error) {
    console.error('Error processing file:', error);
    event.sender.send('file-processing-error', error.message);
    event.sender.send('resetMessage');
  }
});

function initializePaths() {
  const userDataPath = app.getPath('userData');
  const localDataPath = path.join(userDataPath, 'localData');
  if (!fs.existsSync(localDataPath)) {
    console.log('No folder present, creating...');
    fs.mkdirSync(localDataPath);
  }
  console.log('Folder already exists, continue...');
  setLocalDataPath(localDataPath);
}
ipcMain.on('try-connection-again', () => {
  checkConnectionAndShowView();
});
