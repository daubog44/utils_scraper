const { processCSV, readJSON } = require("./io_ops");
const { get_urls } = require("./scrapes/get_urls");

const { resetAndReturnQueues, startApp } = require("./Queues");

const main = async (args) => {
  const parallel = Number(args[0]) || 5;
  const redisOptions = {
    port: 6379,
    host: "localhost",
    password: "",
    tls: false,
  };
  try {
    const queuesObj = await resetAndReturnQueues(
      ["fetch-urls", "write-urls"],
      redisOptions
    );
    const rows = await processCSV("../books.csv");
    rows.forEach((element) => {
      queuesObj["fetch-urls"].add({
        autore: element["AUTORE"],
        anno: element["ANNO_PUBBLICAZIONE"],
        casaEditrice: element["CASA_EDITRICE"],
        id: element["ID"],
        categoria: element["CATEGORIA"],
        note: element["NOTE"],
        scomparto: element["SCOMPARTO"],
        query: element["TITOLO"] + " libro",
      });
    });

    const app = startApp(Object.values(queuesObj), 4500);

    const totalJobs = rows.length;

    queuesObj["fetch-urls"].on("completed", async (job, result) => {
      // stop server
      if (result === totalJobs) {
        console.log("🎉 All jobs completed. Shutting down...");
        await queuesObj["fetch-urls"].close();
        //process.exit(0);
      }
    });

    Object.values(queuesObj).forEach((queu) =>
      queu.on("error", async (err) => {
        console.error(err);
      })
    );

    await get_urls(
      rows,
      queuesObj["fetch-urls"],
      queuesObj["write-urls"],
      parallel
    );
  } catch (err) {
    console.error(err);
  }
};

const args = process.argv.slice(2);

main(args);
