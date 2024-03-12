// path utils
const printFileNames = (files: string[]): void => {
  files.forEach((file) => console.log(file));
};

const getFilePathName = (name: string, files: string[]): string => {
  let filename: string | undefined = files.find((file) => file === name);
  if (!filename) {
    console.log('No file has been found or dir is empy');
    return '';
  }

  return filename;
};

export default {
  printFileNames,
  getFilePathName,
};
