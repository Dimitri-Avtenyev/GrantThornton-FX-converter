
import ExcelJs from "exceljs";
import { ExchangeRate, FoundValutaData } from "../types";
import { Finds } from "./checkValuta";
import datastorageService from "./datastorage.service";

//http://localhost:3000/uploadfile/demo

// let object : Finds = {} as Finds;  
//   object = checkValuta.findColums(firstSheet); 
//   let beginAndEndValues = checkValuta.findDataSet(firstSheet, object.columnLetterValuta)

//   mainTestAddData(firstSheet, object, beginAndEndValues);


export const AddData = async (worksheet: ExcelJs.Worksheet, objectFinds: Finds, colulmHeaders: number[]): Promise<void> => {
  AddColumn(worksheet, 12);  // aanpassen  K + 1, K omzetten naar number 
  // console.log(getNextChar("Z"));
  objectFinds.columnLetterRate = getNextChar(objectFinds.columnLetterValue); 
  objectFinds.columnLetterConversion = getNextChar(objectFinds.columnLetterRate);  
  
  copyColumnStyle(worksheet, objectFinds.columnLetterValue, objectFinds.columnLetterRate);
  copyColumnStyle(worksheet, objectFinds.columnLetterValue, objectFinds.columnLetterConversion);

  await AddDataInColomn(worksheet, objectFinds, colulmHeaders);
}

// Voegt 2 kollomen toe naast values kollom
export const AddColumn = (worksheet: ExcelJs.Worksheet, startColomn: number): ExcelJs.Worksheet => {
  worksheet.spliceColumns(startColomn, 0, [], []);
  return worksheet;
};

const copyColumnStyle = (worksheet: ExcelJs.Worksheet, keyCopyFromColumn: string, keyToCopyToColumn: string): ExcelJs.Worksheet => {
  const toCopytoColumn: ExcelJs.Column = worksheet.getColumn(keyToCopyToColumn);
  toCopytoColumn.width = worksheet.getColumn(keyCopyFromColumn).width;

  toCopytoColumn.eachCell(function (cell, rowNumber) {
    cell.style = worksheet.getCell(keyCopyFromColumn + rowNumber).style;
    // cell.value = worksheet.getCell(keyCopyFromColumn +rowNumber).value;
    // formula zit in value
  });
  return worksheet;
}

//Conversion

const AddDataInColomn = async (worksheet: ExcelJs.Worksheet, objectFinds: Finds, beginAndEndValues: number[]): Promise<void> => {
  //CurrencyRate
  //const rateColumn = worksheet.getColumn(objectFinds.columnLetterRate); // K? L
  // for (let i = 0; i < worksheet.rowCount; i++) {
  //     if (worksheet.getCell(objectFinds.columnLetterDate + i).type == ExcelJs.ValueType.Date) {
  //         if(worksheet.getCell(objectFinds.columnLetterValuta+ i).value=== "EUR"){
  //             worksheet.getCell(objectFinds.columnLetterRate+ i).value = 1;
  //         }else{
  //             let rates:ExchangeRate[] = await datastorageService.getLocalData(worksheet.getCell(objectFinds.columnLetterDate + i).value as Date);
  //             let excRate:ExchangeRate|undefined  = rates.find( x => x.symbol === worksheet.getCell(objectFinds.columnLetterValuta + i).text);
  //             console.log(excRate?.rate);
  //             worksheet.getCell(objectFinds.columnLetterRate+ i).value = excRate?.rate;

  //         }
  //     }
  // }


  // --- ~D --- ///
  // --- ******************************** --- ///

  let rateColumn: string = "";
  let dateColumn: string = "";
  for (let i = 1; i < worksheet.actualColumnCount; i++) {
    worksheet.getColumn(i).eachCell(c => {
      if (c.value === "EUR") {
        rateColumn = worksheet.getColumn(i).letter;
      } else if (c.type === ExcelJs.ValueType.Date) {
        dateColumn = worksheet.getColumn(i).letter;
      }
    });
  }
  console.log(`rates found @ ${rateColumn} and its dates @ ${dateColumn}`);

  const column: ExcelJs.Column = worksheet.getColumn(objectFinds.columnLetterRate);
  const promises: Promise<void>[] = [];

  column.eachCell(async c => {
    if (worksheet.getCell(objectFinds.columnLetterDate + c.row).type === ExcelJs.ValueType.Date) {
      let invoiceDate: Date = worksheet.getCell(objectFinds.columnLetterDate + c.row).value as Date;

      if (worksheet.getCell(objectFinds.columnLetterValuta + c.row).value === "EUR") {
        c.value = 1;

      } else {
        let symbol: string = worksheet.getCell(objectFinds.columnLetterValuta + c.row).text;
        //let fxRates: ExchangeRate[] = await datastorageService.getDbData(invoiceDate);
        let promise: Promise<void> = datastorageService.getLocalData(invoiceDate)
          .then(fxRates => {
            let fxRate: ExchangeRate | undefined = fxRates.find(x => x.symbol === symbol);
            c.value = fxRate?.rate;
            console.log(c.value);
          });
        promises.push(promise);
      }
    }
  });
  await Promise.allSettled(promises);
  console.log("async done, rates added!")


  // --- ******************************** --- ///

  for (let num of beginAndEndValues) {
    worksheet.getCell(objectFinds.columnLetterRate + num).value = "Rate"; // L
  }

  //Conversion
  const conversionColumn: ExcelJs.Column = worksheet.getColumn(objectFinds.columnLetterConversion);
  conversionColumn.eachCell(c => {
    if (worksheet.getCell(objectFinds.columnLetterDate + c.row).type === ExcelJs.ValueType.Date) {
      const totalCell = worksheet.getCell(objectFinds.columnLetterValue + c.row);
      const rateCell = worksheet.getCell(objectFinds.columnLetterRate + c.row);
      if(totalCell.value && rateCell.value) {
        c.value = parseFloat(totalCell.value.toString()) / parseFloat(rateCell.value!.toString());
      }
      
    }
  })
  // --- ******************************** --- ///
  for (let i = 0; i < worksheet.rowCount; i++) {
    if (worksheet.getCell(objectFinds.columnLetterDate + i).type == ExcelJs.ValueType.Date) {
      // let rate = parseInt(worksheet.getCell(objectFinds.columnLetterRate).text); 
      // let value = parseInt(worksheet.getCell(objectFinds.columnLetterValue).text); 
      // worksheet.getCell(objectFinds.columnLetterConversion +i ).value = value*rate; 
      //    worksheet.getCell(objectFinds.columnLetterConversion + i).value = worksheet.getCell(objectFinds.columnLetterValue +i).value as number * 1.4694
      // worksheet.getCell(objectFinds.columnLetterConversion + i).value = {sharedFormula :`${objectFinds.columnLetterValue + i}*${objectFinds.columnLetterRate+i}`, result:0};  

    }
  }
  for (let num of beginAndEndValues) {
    worksheet.getCell(objectFinds.columnLetterConversion + num).value = "Conversion"; // M
  }
}
       
const getNextChar= (char:string): string =>{  // ZZ--> AAA
    let letter = ""; 
    char = char.toLocaleUpperCase(); 
        if(char.endsWith('Z')){ //AZ --> BA
            let strSplit =char.split(''); 
            for (let i = char.length -1; i >= 0; i--) {            
                if(strSplit[i] === 'Z'){
                    strSplit[i] = 'A';   
                }else{
                    strSplit[i] =  String.fromCharCode(strSplit[i].charCodeAt(0)+1);
                    break;
                }
            }    
            letter =strSplit.join(''); 
            if(strSplit.every(val => val === strSplit[0])){  // ZZ --> AAA
                letter = letter + 'A'; 
            }
        }else{  // AB --> AC  , AAB --> AAC
            letter = char.substring(0, char.length -1);
            letter = letter + String.fromCharCode(char.substring(char.length -1).charCodeAt(0)+1);
        }
    return letter;   
}
       



