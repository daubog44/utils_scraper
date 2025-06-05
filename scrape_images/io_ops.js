const fs = require("fs");
const fsp = require("fs").promises;
const csv = require("csv-parser");
const axios = require("axios");

async function readJSON() {
  const filePath = "./urls.json";
  const data = await fsp.readFile(filePath, "utf8");
  json = JSON.parse(data);
  return json;
}

async function updateJsonFile(id, insert) {
  try {
    let json = {}; // Try reading the file
    const filePath = "./urls.json";
    try {
      const data = await fsp.readFile(filePath, "utf8");
      json = JSON.parse(data);
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // Ignore file not found, but throw other errors
    } // Check if the key exists

    if (json[id] !== undefined) {
      console.log("Entry already exists. Skipping write.");
      return;
    } // Add new entry and write back

    json[id] = insert;
    await fsp.writeFile(filePath, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error handling JSON file:", err);
  }
}

async function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        resolve(rows);
      })
      .on("error", (err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function downloadImage(url, outputPath) {
  if (fs.existsSync(outputPath)) return;
  const writer = fs.createWriteStream(outputPath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      //console.log("Image downloaded successfully:", outputPath);
      resolve(true);
    });
    writer.on("error", (err) => {
      console.error("sownload image failed: " + err);
      reject(err);
    });
  });
}

module.exports = { updateJsonFile, processCSV, readJSON, downloadImage };
