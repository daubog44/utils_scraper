const {
  updateJsonFile,
  readJSON,
  downloadImage,
  writeLargeJsonObject,
} = require("../io_ops");
const { get_url, DoesentExsistInAmazon } = require("./scrape");
const cliProgress = require("cli-progress");

async function get_urls(rows, fetchQueue, writeQueue, parallel) {
  // bar and vars definitions
  const bar = new cliProgress.SingleBar({
    format:
      "Progress |{bar}| {percentage}% || {value}/{total} || ETA: {eta_formatted} || started {duration_formatted}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  const dataExsisted = await readJSON("./urls.json");
  let i = 0;
  bar.start(rows.length, i);
  const promises = [];

  // start writequeue (to avoid race conditions)
  const writeJobs = writeQueue.process(1, async (job) => {
    const data = job.data;
    const filePath = data.filePath;
    const json = data.json;
    const update = data.isUpdate;
    if (!update) {
      const fetch = data.fetch;
      const processed = fetch ? await readJSON("./urls.json") : null;
      await writeLargeJsonObject(filePath, processed || json);
    } else {
      const id = data.id;
      await updateJsonFile(id, json);
    }
  });

  // start process bot in parallel
  const fetchJobs = fetchQueue.process(parallel, async (job) => {
    const data = job.data;
    const id = data.id;
    const query = data.query;
    const autore = data.autore;
    const anno = data.anno;
    const casaEditrice = data.casaEditrice;
    const img = `../covers/${id}.jpg`;
    if (dataExsisted[id] !== undefined) {
      i++;
      bar.update(i);
      return i;
    }

    try {
      //backup
      if (i > 0 && i % Math.round(rows.length * 0.01) === 0) {
        await writeQueue.add({
          fetch: true,
          isUpdate: false,
          filePath: "./backup.json",
        });
      }
      // start bot
      const { currentUrl, book } = await get_url(query, 3, 10000);
      if (currentUrl && data) {
        promises.push(downloadImage(book.itemImg, img));
        await writeQueue.add({
          json: {
            data: book,
            query,
            casaEditrice,
            autore,
            urlSearch: currentUrl,
            imageDwonloaded: img.split("/").at(-1),
            anno,
            success: true,
          },
          isUpdate: true,
          id,
          filePath: "./urls.json",
        });
      }
    } catch (err) {
      //error handaling
      if (err.message === "navigation error") {
        i++;
        bar.update(i);
        return i;
      }
      if (err instanceof DoesentExsistInAmazon) {
        await writeQueue.add({
          json: {
            notFoundAt: err.url,
            query,
            autore,
            anno,
            casaEditrice,
            success: false,
          },
          isUpdate: true,
          id,
          filePath: "./urls.json",
        });
      } else {
        console.error("Error processing " + id + " row:", err);
        await writeQueue.add({
          json: {
            errorScrape: err.message,
            query,
            autore,
            anno,
            casaEditrice,
            success: false,
          },
          isUpdate: true,
          id,
          filePath: "./urls.json",
        });
      }
    }
    i++;
    bar.update(i);
    return i;
  });

  // awaits
  await Promise.all([fetchJobs, writeJobs]);
  await Promise.all(promises);
  bar.stop();
}

module.exports = { get_urls };
