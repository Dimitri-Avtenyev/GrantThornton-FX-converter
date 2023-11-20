import express from "express";
import fileHandlerController from "../controllers/fileInput.controller";
import multer from "multer";

const router = express.Router();

// set storage for uploaded file in input folder
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./src/input");
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  }
});
const upload = multer({ storage: storage});

// upload file
router.post("/", upload.single("file"), fileHandlerController.getFile);

// get for demo purpose
router.get('/demo', fileHandlerController.getFileLocalDemo);


export default router;
