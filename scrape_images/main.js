const {
  processCSV,
  updateJsonFile,
  readJSON,
  downloadImage,
} = require("./io_ops");
const { get_url, DoesentExsistInAmazon } = require("./scrape");
const Queue = require("bull");
const cliProgress = require("cli-progress");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const express = require("express");

const bar = new cliProgress.SingleBar({
  format:
    "Progress |{bar}| {percentage}% || {value}/{total} || ETA: {eta_formatted} || started {duration_formatted}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

async function get_urls(rows, fetchQueue, parallel) {
  const dataExsisted = await readJSON();
  let started = false;
  let i = 0;
  bar.start(rows.length, i);
  const promises = [];

  await fetchQueue.process(parallel, async (job) => {
    const data = job.data;
    const id = data.id;
    const query = data.query;
    const autore = data.autore;
    const anno = data.anno;
    const casaEditrice = data.casaEditrice;

    const img = `../covers/${id}.jpg`;
    if (!started) {
      //i = Object.keys(dataExsisted).length;
      started = true;
    }
    if (dataExsisted[id] !== undefined) {
      i++;
      bar.update(i);
      return i;
    }
    try {
      const { currentUrl, data } = await get_url(query, 3, 10000);
      if (currentUrl && data) {
        promises.push(downloadImage(data[0].itemImg, img));
        await updateJsonFile(id, {
          data: data[0],
          query,
          casaEditrice,
          autore,
          urlSearch: currentUrl,
          imageDwonloaded: img.split("/").at(-1),
          anno,
          success: true,
        });
      }
      //console.log("success scraped row: " + id);
    } catch (err) {
      if (err.message === "navigation error") {
        i++;
        bar.update(i);
        return i;
      }
      if (err instanceof DoesentExsistInAmazon) {
        await updateJsonFile(id, {
          notFoundAt: err.url,
          query,
          autore,
          anno,
          casaEditrice,
          success: false,
        });
      } else {
        console.error("Error processing " + id + " row:", err);
        await updateJsonFile(id, {
          errorScrape: err.message,
          query,
          casaEditrice,
          autore,
          anno,
          success: false,
        });
      }
    }
    i++;
    bar.update(i);
    return i;
  });
  await Promise.all(promises);
  bar.stop();
}

(async () => {
  const parallel = 5;

  const redisOptions = {
    port: 6379,
    host: "localhost",
    password: "",
    tls: false,
  };
  try {
    let fetchQueue = new Queue("fetch-urls", { connection: redisOptions });
    await fetchQueue.obliterate({ force: true });
    fetchQueue = new Queue("fetch-urls", { connection: redisOptions });
    const rows = await processCSV("../books.csv");
    await fetchQueue.empty();
    rows.forEach((element) => {
      fetchQueue.add({
        autore: element["AUTORE"],
        anno: element["ANNO_PUBBLICAZIONE"],
        casaEditrice: element["CASA_EDITRICE"],
        id: element["ID"],
        query: element["TITOLO"] + " libro",
      });
    });

    const totalJobs = rows.length;

    const app = express();
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/ui");

    createBullBoard({
      queues: [new BullAdapter(fetchQueue)],
      serverAdapter,
    });

    app.use("/ui", serverAdapter.getRouter());

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Bull Board running at http://localhost:${PORT}/ui`);
    });

    fetchQueue.on("completed", async (job, result) => {
      if (result === totalJobs) {
        console.log("🎉 All jobs completed. Shutting down...");
        await fetchQueue.close();
        server.close(() => {
          console.log("🛑 Server closed.");
          process.exit(0);
        });
      }
    });

    await get_urls(rows, fetchQueue, parallel);
  } catch (err) {
    console.error(err);
  }
})();
