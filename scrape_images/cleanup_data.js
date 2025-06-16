const { processCSV, readJSON, writeLargeJsonObject } = require("./io_ops");

const cleanup = async () => {
  const dataExsisted = await readJSON("./urls.json");
  const rows = await processCSV("../books.csv");

  const cleanupData = {};

  for (const [key, value] of Object.entries(dataExsisted)) {
    const el = rows.find((el) => el["ID"] === key);
    if (value["data"]?.details)
      value["data"].details = value["data"]?.details?.map((text) =>
        text.startsWith("Recensioni dei clienti") && text.includes("var")
          ? text.split("var")[0].trim()
          : text
      );
    if (!el) throw new Error();
    cleanupData[key] = {
      ...value,
    };
    if (!value["categoria"])
      cleanupData[key]["categoria"] = el["CATEGORIA"] ? el["CATEGORIA"] : "";
    if (!value["note"]) cleanupData[key]["note"] = el["NOTE"] ? el["NOTE"] : "";
    if (!value["scomparto"])
      cleanupData[key]["scomparto"] = el["SCOMPARTO"] ? el["SCOMPARTO"] : "";
    if (!value["success"] && value["errorScrape"]) {
      //delete cleanupData[key];
    }
  }

  await writeLargeJsonObject("./cleanup.json", cleanupData);
};
cleanup();
