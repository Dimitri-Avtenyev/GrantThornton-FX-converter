import { ExchangeRate, ExchangeRateData, ExchangeRateDict } from "../types";

//--- data retrieval from "ECB ---//
// D = Day, . = wildcard (can be filled with other symbols), EUR = symbol, 
// SP00 = ECB foreign exchange reference rates – code, A = time variation
// ---
// ? parameters -> startPeriod, endPeriod, format, detail
// dates in ISO format
// https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?startPeriod=2023-10-17&endPeriod=2023-10-18&format=jsondata&detail=dataonly


// available formats jsondata, csvdata, structurespecificdata, genericdata
// ECB webservice entry point
const entryPoint: string = "https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A";

const getEurRates = async (date: Date, endDate?: Date, format: string = "jsondata"): Promise<ExchangeRateDict> => {

  if (!endDate) {
    endDate = date
    date = weekdayCheckAndAdjust(date); //only needed if call is for one date
  }
  let startPeriod = date.toISOString().split("T")[0];
  let endPeriod = endDate.toISOString().split("T")[0];
  
  const response = await fetch(`${entryPoint}?startPeriod=${startPeriod}&endPeriod=${endPeriod}&format=${format}&detail=dataonly`);

  const data: ExchangeRateData = await response.json();
  // dict builder
  let eurRates: ExchangeRateDict = await exchangeRateDictBuilderECB(data);

  return eurRates;
}


const exchangeRateDictBuilderECB = async (data: ExchangeRateData): Promise<ExchangeRateDict> => {
  let eurRates: ExchangeRateDict = {};
  let observations:number = (data.structure.dimensions.observation[0].values).length;
  let dataSetSeries:number =  Object.keys(data.dataSets[0].series).length;

  for (let i = 0; i < observations; i++) {

    for (let j = 0; j < dataSetSeries; j++) {
      let symbol:string = "";
      let rate:number = 0;
      // check needed, data not always uniform -> some observations/values missing mostly going from 2022 to 2023
      if (data.dataSets[0].series[`0:${j}:0:0:0`] && data.dataSets[0].series[`0:${j}:0:0:0`].observations && data.dataSets[0].series[`0:${j}:0:0:0`].observations[i]) {
        symbol = data.structure.dimensions.series[1].values[j].id;
        rate = data.dataSets[0].series[`0:${j}:0:0:0`].observations[i][0];

        let eurRate: ExchangeRate =
        {
          symbol: symbol,
          rate: rate
        }
        let isoDate:string = data.structure.dimensions.observation[0].values[i].id;
        if (eurRates[isoDate] !== undefined) {
          eurRates[isoDate].push(eurRate);
        } else {
          eurRates[isoDate] = [eurRate]
        }
      }
    }
  }
  return eurRates;
}



//--- data retrieval from "exchangeratesapi" ---///
//   todo?
// ---                                      ---///

const atLeastOneDayOlder = (date: Date): boolean => {
  const today: Date = new Date();
  const timeDiff = today.getTime() - date.getTime();
  const DAY_IN_MILLISECONDS: number = 24 * 60 * 60 * 1000;

  return timeDiff > DAY_IN_MILLISECONDS;
}
const weekdayCheckAndAdjust = (date: Date): Date => {
  const dayOfWeek: number = date.getDay();
  if(!atLeastOneDayOlder(date)) {
    console.log(`${date} is too recent(needs to be at least one day older), no data yet, adjusting...`)
    date.setDate(date.getDate() - 1);
  }
  if (dayOfWeek === 0) { // sunday -> substract one day
    console.log(`${date} is on sunday, adjusting...`);
    date.setDate(date.getDate() - 2);
  } else if (dayOfWeek === 6) { // saturdat -> substract two days
    console.log(`${date} is on saturday, adjusting...`)
    date.setDate(date.getDate() - 1);
  } 
  
  return date;
}
export default {
  getEurRates,
  exchangeRateDictBuilderECB,
  atLeastOneDayOlder,
  weekdayCheckAndAdjust
}