import Exceljs from "exceljs";
import { FoundValutaData } from "../types";
export interface Finds {
  columnLetterValue : string; 
  columnLetterValuta : string; 
  columnLetterDate : string; 
  columnLetterRate : string; 
  columnLetterConversion :string; 
}
 
const findDataSet = (sheet : Exceljs.Worksheet, columnletter: string) :number[] => {
  let bool: boolean = false
  let columnHeaders: number[] = [];
  let dataEnd: number[] = [];
 
    //kolomhoofdingen zoeken
    sheet.getColumn(columnletter).eachCell((c) => {
      if(c.text != "" && bool == false)
      {      
        columnHeaders.push(parseInt(c.address.substring(1,c.address.length)))
        bool = true
      }
      if(c.text == "" && bool == true)  
      {
        bool = false
        // columnHeaders.push(parseInt(c.address.substring(1,c.address.length))-2)
      }
    })
 
    // console.log(columnHeaders)
    // console.log(dataEnd)
 
    return columnHeaders;
}
 
const findColums = (sheet : Exceljs.Worksheet) :Finds => {
  let valutaColumnLetter: string = "";
  let dateColumnLetter: string = "";
  let valueColumnLetter: string = "";
  let cellData: string = "";
  let object : Finds = {} as Finds; 
  // kolommen bepalen
  let columnLetter: string[] = []; 
for (let i = 1; i < sheet.actualColumnCount; i++) {
  sheet.getColumn(i).eachCell((c) => {
    if (c.value === "EUR") {
      valutaColumnLetter = sheet.getColumn(i).letter;
    }
    if (c.type == Exceljs.ValueType.Date) {
      dateColumnLetter = sheet.getColumn(i).letter;
    }
    cellData = c.text;
    let counter: number = cellData.length;
    if (cellData.charAt(counter - 3) === "." && c.type == Exceljs.ValueType.Number) {
      valueColumnLetter = sheet.getColumn(i).letter;
    }
  }); 
}
  object.columnLetterDate = dateColumnLetter;
  object.columnLetterValue = valueColumnLetter;
  object.columnLetterValuta = valutaColumnLetter; 
return object;
}

export default {
  findColums, 
  findDataSet
}; 
 
 
 
 
