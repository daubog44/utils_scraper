const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const UserAgent = require("user-agents");
const { wait } = require("../utils/index");

class DoesentExsistInAmazon extends Error {
  constructor(url) {
    super("does not exsist in amazon");
    this.name = "DoesentExsistInAmazon";
    this.url = url;
  }
}

async function hideBrowser(nightmare) {
  const agent = new UserAgent();
  await nightmare.useragent(agent.toString());
  await nightmare.evaluate(async () => {
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["it-IT", "en"],
    });
    delete navigator.__proto__.webdriver;

    Object.defineProperty(screen, "width", { get: () => 1920 });
    Object.defineProperty(screen, "height", { get: () => 1080 });
    Intl.DateTimeFormat = () => ({
      resolvedOptions: () => ({ timeZone: "Europe/Rome" }),
    });
  });
}

async function get_url(query, maxRetries, timedout) {
  const nightmare = Nightmare({
    openDevTools: {
      mode: "detach",
    },
    show: false,
    waitTimeout: timedout,
    gotoTimeout: timedout,
    loadTimeout: timedout,
    typeInterval: 20,
  });
  try {
    // vai a
    const url = `https://www.amazon.it/s?k=${query}&i=stripbooks`;
    await nightmare.goto(url);
    //await hideBrowser(nightmare);
    // se esiste un popup, cliccalo
    let exsist = await nightmare.exists(
      "#CardInstanceBlrxAMai9ZLeEK3KDYmpXw > a > div > img"
    );
    if (exsist)
      await nightmare.click(
        "#CardInstanceBlrxAMai9ZLeEK3KDYmpXw > a > div > img"
      );

    exsist = await nightmare.exists("#sp-cc-accept");
    if (exsist) await nightmare.click("#sp-cc-accept");

    await nightmare.wait("#search");
    const currentUrl = await nightmare.url();

    // prendi l'html risulato
    let html = await nightmare.evaluate(() => {
      const element = document.querySelector("#search");
      return element ? element.innerHTML : null;
    });

    let $ = cheerio.load(html);

    //verifica i risulati
    const h2Text = $("h2").text().trim();
    const h1Text = $("h1").text().trim();
    if (
      h2Text.includes("Nessun risultato per") ||
      h1Text.includes("Nessun risultato per")
    ) {
      await nightmare.end().catch((error) => {
        console.error("Search failed:", error);
      });
      throw new DoesentExsistInAmazon(currentUrl);
    }

    const elementsWithRole = $('[role="listitem"]');

    // prendi i vclori
    const data = [];
    elementsWithRole.each((i, el) => {
      const link = $(el).find(
        "a.a-link-normal.s-line-clamp-2.s-link-style.a-text-normal"
      );
      const itemAuthor = $(el)
        .find("div.a-row.a-size-base.a-color-secondary")
        .text()
        .trim();

      // Get the href attribute
      const itemUrl = link.attr("href");
      const itemPrice = $(el).find("span.a-offscreen").text().trim();
      const itemTitle = link.find("h2 > span").text().trim();
      const img = $(el).find("img").attr("src");
      data.push({
        itemImg: img,
        itemPrice,
        itemUrl: itemUrl ? "https://www.amazon.it/" + itemUrl : null,
        itemTitle,
        itemAuthor,
        description: "",
        details: [],
      });
    });

    // vai alla pagina del primo elemento
    const el = data.find((el) => Boolean(el.itemUrl));
    if (data.find((el) => Boolean(el.itemUrl))) {
      await nightmare.goto(el.itemUrl);

      await nightmare.wait("#dp-container");

      html = await nightmare.evaluate(() => {
        const element = document.querySelector("#dp-container");
        return element ? element.innerHTML : null;
      });

      $ = cheerio.load(html);

      const description = $(
        "#bookDescription_feature_div > div > div.a-expander-content.a-expander-partial-collapse-content > span"
      )
        .text()
        .trim();
      el["description"] = description;
      //prendi i risultati
      const itemPrice = $("#a-autoid-0-announce > span.slot-price > span")
        .text()
        .trim();
      if (itemPrice) {
        el.itemPrice = itemPrice;
      }
      const textItemDetails = [];
      $("#detailBullets_feature_div ul.a-unordered-list li").each((i, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim(); // Clean up whitespace
        if (text) {
          textItemDetails.push(
            text.startsWith("Recensioni dei clienti")
              ? text.split("var")[0].trim()
              : text
          );
        }
      });
      if (textItemDetails) el["details"] = textItemDetails;
    }
    // fine
    await nightmare.end().catch((error) => {
      console.error("Search failed:", error);
    });
    return { currentUrl, book: el };
  } catch (err) {
    await nightmare.end().catch((error) => {
      console.error("Nightmare instance failed to end:", error);
    });
    if (maxRetries > 0) {
      return get_url(query, maxRetries - 1);
    } else throw err;
  }
}

module.exports = { get_url, DoesentExsistInAmazon };
