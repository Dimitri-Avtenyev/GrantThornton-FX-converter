import ExcelJs from "exceljs";
import fs from "fs/promises";
import path from "path";
import checkValuta, { Finds } from "./checkValuta";
import { AddData } from "./AddDataInColomn";


// const INPUT_DIR = "./src/input";
const OUTPUT_DIR = "./src/output";

// create workbook instance
const main = async (workbook: ExcelJs.Workbook, path:string):Promise<ExcelJs.Workbook> => {
  // const files: string[] = await fs.readdir(INPUT_DIR);

  let xlsx:ExcelJs.Workbook = await workbook.xlsx.readFile(path);
  
  const promises:Promise<void>[] = [];
  xlsx.eachSheet(worksheet => {
    let finds: Finds = checkValuta.findColums(worksheet);
      console.log(finds.columnLetterValuta);
     
      //let beginAndEndValues = checkValuta.findDataSet(worksheet, finds.columnLetterValuta);
      console.log(`working for: ${worksheet.name}`);
      //await AddData(worksheet, finds, beginAndEndValues);
      if (finds.columnLetterValuta) {
        let beginAndEndValues = checkValuta.findDataSet(worksheet, finds.columnLetterValuta);
        let promise = AddData(worksheet, finds, beginAndEndValues).then(() =>  console.log(`DONE for: ${worksheet.name}`));
        promises.push(promise);
      }

  });
  await Promise.allSettled(promises);

  return xlsx;
  
}

// demo find value and print location found said value
const findFxValue = async (input: ExcelJs.Worksheet) => {
  let columnLetter:string = "";
 
  for (let i = 1; i<input.actualColumnCount; i++) {
   
    input.getColumn(i).eachCell(c => {
     if (c.value === "EUR") {
      columnLetter = input.getColumn(i).letter;
     }
    });
  }
  //console.log(`Foreign exchange symbols are found @ col ${columnLetter}`);
}

const checkFileExt = async (fileName:string):Promise<boolean> => {
  const allowedFileExtension:string = ".xlsx"
  const fileExtension = path.extname(fileName).toLowerCase();

  if (allowedFileExtension !== fileExtension) {
    throw new Error("File extension not allowed");
  }
  return allowedFileExtension === fileExtension;


}

export default {
  main,
  checkFileExt
};