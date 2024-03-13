import ExcelJs from 'exceljs';
import { ExchangeRate } from '../types';
import { Finds } from './checkValuta';
import datastorageService from './datastorage.service';

export const AddData = async (
  worksheet: ExcelJs.Worksheet,
  objectFinds: Finds,
  columnHeaders: number[],
): Promise<void> => {
  let colNumber: number = worksheet.getColumn(
    objectFinds.columnLetterValue,
  ).number;
  AddColumn(worksheet, colNumber + 1);

  objectFinds.columnLetterRate = getNextChar(objectFinds.columnLetterValue);
  objectFinds.columnLetterConversion = getNextChar(
    objectFinds.columnLetterRate,
  );

  copyColumnStyle(
    worksheet,
    objectFinds.columnLetterValue,
    objectFinds.columnLetterRate,
  );
  copyColumnStyle(
    worksheet,
    objectFinds.columnLetterValue,
    objectFinds.columnLetterConversion,
  );

  await AddDataInColomn(worksheet, objectFinds, columnHeaders);
};

export const AddColumn = (
  worksheet: ExcelJs.Worksheet,
  startColomn: number,
): ExcelJs.Worksheet => {
  worksheet.spliceColumns(startColomn, 0, [], []);
  return worksheet;
};

const copyColumnStyle = (
  worksheet: ExcelJs.Worksheet,
  keyCopyFromColumn: string,
  keyToCopyToColumn: string,
): ExcelJs.Worksheet => {
  const toCopytoColumn: ExcelJs.Column = worksheet.getColumn(keyToCopyToColumn);
  toCopytoColumn.width = worksheet.getColumn(keyCopyFromColumn).width;

  toCopytoColumn.eachCell(function (cell, rowNumber) {
    cell.style = worksheet.getCell(keyCopyFromColumn + rowNumber).style;
  });
  return worksheet;
};

//Conversion

const AddDataInColomn = async (
  worksheet: ExcelJs.Worksheet,
  objectFinds: Finds,
  beginAndEndValues: number[],
): Promise<void> => {
  //CurrencyRate

  // --- ~Dimitri --- ///
  // --- ******************************** --- ///

  let rateColumn: string = '';
  let dateColumn: string = '';
  for (let i = 1; i < worksheet.actualColumnCount; i++) {
    worksheet.getColumn(i).eachCell((c) => {
      if (c.value === 'EUR') {
        rateColumn = worksheet.getColumn(i).letter;
      } else if (c.type === ExcelJs.ValueType.Date) {
        dateColumn = worksheet.getColumn(i).letter;
      }
    });
  }

  const column: ExcelJs.Column = worksheet.getColumn(
    objectFinds.columnLetterRate,
  );
  const promises: Promise<void>[] = [];

  column.eachCell(async (c) => {
    if (
      worksheet.getCell(objectFinds.columnLetterDate + c.row).type ===
      ExcelJs.ValueType.Date
    ) {
      const invoiceDate: Date = worksheet.getCell(
        objectFinds.columnLetterDate + c.row,
      ).value as Date;

      if (
        worksheet
          .getCell(objectFinds.columnLetterValuta + c.row)
          .text.toUpperCase() === 'EUR'
      ) {
        c.value = 1;
      } else {
        let symbol: string = worksheet
          .getCell(objectFinds.columnLetterValuta + c.row)
          .text.toUpperCase();

        // as per request -> date should be 1 day before the invoiceDate

        let oneDayBeforeInvoiceDate: Date = new Date(invoiceDate);
        oneDayBeforeInvoiceDate.setDate(oneDayBeforeInvoiceDate.getDate() - 1);

        let promise: Promise<void> = datastorageService
          .getLocalData(oneDayBeforeInvoiceDate)
          .then((fxRates) => {
            let fxRate: ExchangeRate | undefined = fxRates.find(
              (x) => x.symbol === symbol,
            );
            c.value = fxRate?.rate;
          });
        promises.push(promise);
      }
    }
  });
  await Promise.allSettled(promises);

  // --- ******************************** --- ///

  for (let num of beginAndEndValues) {
    worksheet.getCell(objectFinds.columnLetterRate + num).value = 'Rate'; // L
  }

  //Conversion
  const conversionColumn: ExcelJs.Column = worksheet.getColumn(
    objectFinds.columnLetterConversion,
  );
  conversionColumn.eachCell((c) => {
    if (
      worksheet.getCell(objectFinds.columnLetterDate + c.row).type ===
      ExcelJs.ValueType.Date
    ) {
      const totalCell = worksheet.getCell(
        objectFinds.columnLetterValue + c.row,
      );
      const rateCell = worksheet.getCell(objectFinds.columnLetterRate + c.row);
      if (totalCell.value && rateCell.value) {
        c.value =
          parseFloat(totalCell.value.toString()) /
          parseFloat(rateCell.value!.toString());
      }
    }
  });
  for (let num of beginAndEndValues) {
    worksheet.getCell(objectFinds.columnLetterConversion + num).value =
      'Conversion';
  }
};

const getNextChar = (char: string): string => {
  // ZZ--> AAA
  let letter = '';
  char = char.toLocaleUpperCase();
  if (char.endsWith('Z')) {
    //AZ --> BA
    let strSplit = char.split('');
    for (let i = char.length - 1; i >= 0; i--) {
      if (strSplit[i] === 'Z') {
        strSplit[i] = 'A';
      } else {
        strSplit[i] = String.fromCharCode(strSplit[i].charCodeAt(0) + 1);
        break;
      }
    }
    letter = strSplit.join('');
    if (strSplit.every((val) => val === strSplit[0])) {
      // ZZ --> AAA
      letter = letter + 'A';
    }
  } else {
    // AB --> AC  , AAB --> AAC
    letter = char.substring(0, char.length - 1);
    letter =
      letter +
      String.fromCharCode(char.substring(char.length - 1).charCodeAt(0) + 1);
  }
  return letter;
};
