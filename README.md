# GrantThornton-FX-converter

># Standalone Electron App

## Overview
This is a standalone [Electron](https://www.electronjs.org/) application that allows users to perform specific actions, such as processing Excel files and converting FX to EUR. The application is built using Electron, TypeScript, and other technologies.

## Features
- **Normal functionality for Exchange Rates**: If foreign exchange rate data is not available for a requested date, the application automatically retrieves the first previous available rate from the historical data. This ensures that conversions can always be performed, even if the most recent exchange rate is not present. 
- **Drag and Drop**: Easily drag and drop Excel files onto the application window.
- **Excel Processing**: Utilizes a powerful Excel processing service to perform custom actions on the files.
- **Save Options**: Users can choose where to save the processed files, providing flexibility and control.
- **Platform Support**: The application is designed to run on Windows, macOS, and Linux.


## Usage
1. **Drag and Drop**: Drag and drop Excel files onto the application window.
2. **Adjust Settings**: Configure any specific settings or options for the processing.
3. **Save Processed Files**: Choose where to save the processed files.
4. **Start Processing**: Initiate the processing of the dropped Excel files.


