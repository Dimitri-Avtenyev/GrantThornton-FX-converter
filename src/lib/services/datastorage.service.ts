// import { dbClient } from "../db";
import { ExchangeRate, ExchangeRateDict } from '../types';
import fs from 'fs/promises';
import path from 'path';
import exrService from './exr.service';

// local folder or electron package userData

export let localDataPath: string = path.join(__dirname, '..', 'localData');

export function setLocalDataPath(newPath: string) {
  localDataPath = newPath;
}
let _data: ExchangeRateDict = {};

// const getDbData = async (date: Date): Promise<ExchangeRate[]> => {
//   let _data: ExchangeRateDict = {};
//   date = exrService.weekdayCheckAndAdjust(date);
//   let query: string = date.toISOString().split("T")[0];

//   try {
//     await dbClient.connect();

//     let data: ExchangeRateDict | null = await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).findOne<ExchangeRateDict>({[query]: {$exists:true}});
//     if (!data) {
//       console.log(`No data has been found with for: ${query}, fetching new data from ECB and updating db`);
//       _data = await exrService.getEurRates(date);
//       await saveDbData(_data);
//     } else {
//       _data = data
//     }
//   } catch (err) {
//     console.log(err);
//   } finally {
//     setTimeout(async() => {await dbClient.close()}, 10000)
//   }
//   return _data[query]
// }

// const saveDbData = async (rates: ExchangeRateDict): Promise<void> => {
//   try {
//     await dbClient.connect();

//     // check if collection is empty
//     let collectionCount: number = await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).countDocuments();
//     if (collectionCount === 0) {
//       //data insertion for dict with multiple days of data
//       // convert dict into chuncks of own objects
//       if (Object.keys(rates).length > 1) {
//         const arrRates: ExchangeRateDict[] = [];
//         for (let [key, value] of Object.entries(rates)) {
//           let eurRate: ExchangeRateDict = {
//             [key]: value
//           }
//           arrRates.push(eurRate);
//         }
//         await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).insertMany(arrRates)
//       } else {
//         //data insertion for dict with one day of data
//         await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).insertOne(rates);
//       }

//     } else {
//       // if collection is filled -> only add one by one
//       let key = Object.keys(rates)[0]; //  date in ISO format

//       let duplicate: ExchangeRateDict | null = await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!)
//         .findOne<ExchangeRateDict>({ [key]: { $exists: true } });
//       if (duplicate) {
//         console.log(`Document with date: ${key} already exist.`);
//         return;
//       } else if (Object.keys(rates).length > 1) {
//         console.log(`Document with multiple keys, please provide a dict with one key(=date): aborted`);
//         return;
//       }
//       await dbClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION!).insertOne(rates)
//     }

//   } catch (err) {
//     console.log(err);
//   } finally {
//     await dbClient.close();
//   }
// }

const getLocalData = async (date: Date): Promise<ExchangeRate[]> => {
  date = exrService.weekdayCheckAndAdjust(date);
  let query: string | undefined = date?.toISOString().split('T')[0];

  if (!_data || !_data[query]) {
    const newData = await exrService.getEurRates(date);
    await saveLocalData(newData);

    return newData[query];
  }

  return _data[query] || [];
};

const saveLocalData = async (rates: ExchangeRateDict): Promise<void> => {
  // multiple keys (as ISO date) -> add to existing json
  if (Object.keys(rates).length > 1) {
    for (let [key, value] of Object.entries(rates)) {
      _data[key] = value;
    }
  } else {
    // single key (as ISO date) -> add to existing json
    let keyDate: string = Object.keys(rates)[0];
    if (!_data[keyDate]) {
      _data[keyDate] = rates[keyDate];
    }
  }
};

const GetAndStoreRates = async () => {
  const today: Date = new Date();
  const dayBefore: Date = new Date(today);
  dayBefore.setDate(today.getDate() - 1);

  const rates: ExchangeRateDict = await exrService.getEurRates(dayBefore);
  await saveLocalData(rates);
  //Promise.all([saveDbData(rates), saveLocalData(rates)])
};

const autoGetAndStoreRates = async (time: number) => {
  if (10 > time || time > 86400000) {
    console.log(`${time} is invalid, auto setting to 86400000ms (24h)`);
    time = 86400000;
  }
  setInterval(GetAndStoreRates, time);
};

export const loadLocalFile = async (): Promise<void> => {
  const files: string[] = await fs.readdir(localDataPath);
  const jsonFile = files.find((fileName) => fileName === 'eurRates.json');

  // load document, if exists, locally
  try {
    let localData = await fs.readFile(`${localDataPath}/${jsonFile}`, 'utf-8');
    _data = JSON.parse(localData);
    console.log('json parsed');
  } catch (err) {
    console.log(err);
  }
};

export const saveLocalFile = async () => {
  const files: string[] = await fs.readdir(localDataPath);
  const jsonFile = files.find((fileName) => fileName === 'eurRates.json');

  await fs.writeFile(
    `${localDataPath}/eurRates.json`,
    JSON.stringify(_data),
    'utf-8',
  );
  console.log(`file '${jsonFile}' saved in ${localDataPath}`);
};

export default {
  // getDbData,
  // saveDbData,
  getLocalData,
  saveLocalData,
  GetAndStoreRates,
  autoGetAndStoreRates,
};
