const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");

async function writeLargeJsonObject(filePath, data) {
  await fs.promises.writeFile(
    filePath,
    !filePath.includes("urls.json")
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data),
    "utf-8"
  );
}

async function readJSON(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    const json = JSON.parse(data);
    return json;
  } catch (err) {
    console.error("Error reading JSON:", err);
    return new Promise((resolve, reject) => {
      const jsonStream = fs.createReadStream(filePath, { encoding: "utf8" });
      let data = "";

      jsonStream.on("data", (chunk) => {
        data += chunk;
      });

      jsonStream.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });

      jsonStream.on("error", (err) => {
        reject(err);
      });
    });
  }
}

async function updateJsonFile(id, insert) {
  try {
    let json = {}; // Try reading the file
    const filePath = "./urls.json";
    try {
      json = await readJSON(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // Ignore file not found, but throw other errors
    } // Check if the key exists

    if (json[id] !== undefined) {
      console.log("Entry already exists. Skipping write.");
      return;
    } // Add new entry and write back

    json[id] = insert;
    await writeLargeJsonObject(filePath, json);
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

module.exports = {
  updateJsonFile,
  processCSV,
  readJSON,
  downloadImage,
  writeLargeJsonObject,
};
