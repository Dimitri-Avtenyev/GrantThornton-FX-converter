// import { MongoClient } from "mongodb";
import datastorageService, { localDataPath } from "./services/datastorage.service";
import exrService from "./services/exr.service";
import { ExchangeRateDict } from "./types";
import fs from "fs/promises";

// // replace with YOUR credentials in .env file -> MONGODB_USR and MONGODB_PSW
// // replace uri with copy from mongodb driver connectionstring, keep <username>:<password>

// // ---------------------------------------------------------------------------------------------------------- \\\
// const uri: string = `mongodb+srv://<username>:<password>@cluster0.b4g2p.mongodb.net/?retryWrites=true&w=majority`; // <-- replace
// // ---------------------------------------------------------------------------------------------------------- \\\





// export const connectionString = (uri: string) => {
//   return uri.replace("<username>", `${process.env.MONGODB_USR}`).replace("<password>", `${process.env.MONGODB_PSW}`);;
// }

// connectionString(uri)
// export const dbClient = new MongoClient(connectionString(uri));



// populate db 
let populateddDb: boolean = false; //run only once on startup

// export const populateDB = async (): Promise<boolean> => {
//   if (populateddDb) {
//     return false
//   }
//   try {
//     await dbClient.connect();
//     let collectionCount: number = await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).countDocuments();
    
//     if (collectionCount === 0) {
//       const endPeriod: Date = new Date();
//       const startPeriod: Date = new Date();
//       startPeriod.setFullYear(startPeriod.getFullYear() - 1);

//       let rates: ExchangeRateDict = await exrService.getEurRates(startPeriod, endPeriod);
//       await datastorageService.saveDbData(rates);
//       populateddDb = true;

//       return true;
//     }
//   } catch (err) {
//     console.log(err);
//   } finally {
//     await dbClient.close();
//   }
//   return true;
// }

export const populateLocalDB = async (): Promise<boolean> => {

  const files: string[] = await fs.readdir(localDataPath);
  const jsonFile = files.find(fileName => fileName === "eurRates.json");
  const endPeriod: Date = new Date();
  const startPeriod: Date = new Date();
  startPeriod.setFullYear(startPeriod.getFullYear() - 1);

  // check if file exists and if date is not older than a year
  if (jsonFile) {
    let data: string = await fs.readFile(`${localDataPath}/${jsonFile}`, "utf-8");
    let eurRatesJson: ExchangeRateDict = JSON.parse(data);

    let allDates:string[] = Object.keys(eurRatesJson);
    allDates.sort();
    let oldestDate:number = Date.parse(allDates[0]);
    console.log("oldest date is "+allDates[0])
    let today = Date.parse(endPeriod.toISOString());
    let diff = today - oldestDate;
    const twoYearsInMilliseconds: number = 2 * 365 * 24 * 60 * 60 * 1000;
    // if there are more than 700 and it's older than 2 years -> refresh file with new one
    if (Object.keys(eurRatesJson).length > 700 && diff > twoYearsInMilliseconds) {
      try {
        console.log("File too big and/or too old, repopulating local db...");
        fs.unlink(`${localDataPath}/eurRates.json`);

        let rates: ExchangeRateDict = await exrService.getEurRates(startPeriod, endPeriod);
        await datastorageService.saveLocalData(rates);
        populateddDb = true;
        return true;

      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("File is still recent, no need for populating.");
    }
  } else {
    // no file present
    try {
      console.log("No file found, populating local db...");
      let rates: ExchangeRateDict = await exrService.getEurRates(startPeriod, endPeriod);
      await datastorageService.saveLocalData(rates);
      populateddDb = true;
    } catch (err) {
      console.log(err);
    }
  }
  if (populateddDb) {
    return false;
  }

  return true;
}
