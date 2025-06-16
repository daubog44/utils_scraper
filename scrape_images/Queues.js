const Queue = require("bull");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const express = require("express");

async function resetAndReturnQueues(arr, connection) {
  const result = {};
  for (const str of arr) {
    let queue = new Queue(str, { connection });
    await queue.obliterate({ force: true });
    queue = new Queue(str, { connection });
    result[str] = queue;
  }
  return result;
}

function startApp(arr, PORT) {
  let app = express();
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/ui");

  createBullBoard({
    queues: arr.map((queue) => new BullAdapter(queue)),
    serverAdapter,
  });

  app.use("/ui", serverAdapter.getRouter());

  app.listen(PORT, () => {
    console.log(`🚀 Bull Board running at http://localhost:${PORT}/ui`);
  });

  return app;
}

module.exports = { resetAndReturnQueues, startApp };
