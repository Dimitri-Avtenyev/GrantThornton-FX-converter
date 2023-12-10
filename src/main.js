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
let errorNetworkWindow;

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
function createErrorNetworkWindow() {
  errorNetworkWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname,"..", "public", "logo.png"),
    webPreferences: {
      nodeIntegration: false, 
      preload: __dirname + '/preload.js', 
    },
  });

  errorNetworkWindow.loadFile(path.join(__dirname, 'views', 'connectionError', 'connectionError.html'));

  errorNetworkWindow.on('closed', () => {
    errorNetworkWindow = null;
  });
}
async function checkConnectionAndShowView() {

  if (!net.isOnline()) {
    if(errorNetworkWindow) {
      console.log("window already exists");
    } else {
      createErrorNetworkWindow();
    }
  } else {
    console.log("online, trying again");
    if (errorNetworkWindow) {
      errorNetworkWindow.close();
    }
    await db.populateLocalDB();
    createWindow();
  }
  
}
app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(macosIcon);
  };
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
ipcMain.on('try-connection-again', () => {
  checkConnectionAndShowView();
});

// example create window while loading
// const { app, BrowserWindow } = require('electron');

// let mainWindow;

// function createMainWindow() {
//   mainWindow = new BrowserWindow({ width: 800, height: 600 });
  
//   mainWindow.loadFile('index.html');
  
//   // Uncomment the line below if you want to open the DevTools initially
//   // mainWindow.webContents.openDevTools();

//   // Handle the window being closed
//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });
// }

// function createLoadingWindow() {
//   const loadingWindow = new BrowserWindow({ width: 400, height: 300, frame: false, transparent: true });
  
//   loadingWindow.loadFile('loading.html');
  
//   // Uncomment the line below if you want to open the DevTools initially
//   // loadingWindow.webContents.openDevTools();

//   loadingWindow.on('closed', () => {
//     loadingWindow = null;
//   });

//   return loadingWindow;
// }

// app.whenReady().then(() => {
//   const loadingWindow = createLoadingWindow();

//   // Your "populatedb" logic here (example setTimeout)
//   setTimeout(() => {
//     // Once the process is complete, close the loading window and open the main window
//     loadingWindow.close();
//     createMainWindow();
//   }, 5000); // Replace 5000 with the actual time your "populatedb" process takes

//   // Additional logic or event handling can be added here
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (mainWindow === null) {
//     createMainWindow();
//   }
// });
