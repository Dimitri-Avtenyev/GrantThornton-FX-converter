import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fileHandleRoute from "./routes/fileHandler.route";
import datastorageService from "./services/datastorage.service";
import { populateDB, populateLocalDB } from "./db";

const app = express();

// middleware
app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({extended: true}));
app.use(cors( {
  origin: ["http://localhost:3001"],
  credentials: true
}));

app.set("port", process.env.PORT || 3000);
// router middleware
app.use("/uploadfile", fileHandleRoute);


app.listen(app.get("port"), async () => {
  // start auto get and store rates every 24h
  await datastorageService.autoGetAndStoreRates(86400000);
  // populate DB for 1 year of data
  await Promise.all([ populateLocalDB(), populateDB()]);

  const locationStart:string = `---> http://localhost:${app.get("port")} <---`;
  console.log(`---/ server started at port: ${app.get("port")} \\---`);
  console.log(`    ${"*".repeat(locationStart.length)}\n    ${locationStart}\n    ${"*".repeat(locationStart.length)}`);
});