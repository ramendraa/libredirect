window.browser = window.browser || window.chrome;

import utils from './utils.js'

const targets = /^https?:\/{2}(([a-z]{1,}\.){0,})wikipedia\.org/

let redirects = {
  "wikiless": {
    "normal": [],
    "tor": [],
    "i2p": []
  }
};
function setRedirects(val) {
  browser.storage.local.get('cloudflareList', r => {
    redirects.wikiless = val;
    wikilessNormalRedirectsChecks = [...redirects.wikiless.normal];
    for (const instance of r.cloudflareList) {
      const a = wikilessNormalRedirectsChecks.indexOf(instance);
      if (a > -1) wikilessNormalRedirectsChecks.splice(a, 1);
    }
    browser.storage.local.set({
      wikipediaRedirects: redirects,
      wikilessNormalRedirectsChecks
    })
  })
}

let wikilessNormalRedirectsChecks;

function initWikilessCookies(test, from) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "wikipediaProtocol",
        "wikilessNormalRedirectsChecks",
        "wikilessNormalCustomRedirects",
        "wikilessTorRedirectsChecks",
        "wikilessTorCustomRedirects",
        "wikilessI2pRedirectsChecks",
        "wikilessI2pCustomRedirects",
      ],
      r => {
        let protocolHost = utils.protocolHost(from);
        if (![
          ...r.wikilessNormalRedirectsChecks,
          ...r.wikilessNormalCustomRedirects,
          ...r.wikilessTorRedirectsChecks,
          ...r.wikilessTorCustomRedirects,
          ...r.wikilessI2pRedirectsChecks,
          ...r.wikilessI2pCustomRedirects,
        ].includes(protocolHost)) resolve();

        if (!test) {
          let checkedInstances;
          if (r.wikipediaProtocol == 'normal') checkedInstances = [...r.wikilessNormalRedirectsChecks, ...r.wikilessNormalCustomRedirects]
          else if (r.wikipediaProtocol == 'tor') checkedInstances = [...r.wikilessTorRedirectsChecks, ...r.wikilessTorCustomRedirects]
          else if (r.wikipediaProtocol == 'i2p') checkedInstances = [...r.wikilessI2pRedirectsChecks, ...r.wikilessI2pCustomRedirects]

          for (const to of checkedInstances) {
            utils.copyCookie('wikiless', from, to, 'theme');
            utils.copyCookie('wikiless', from, to, 'default_lang');
          }
        }
        resolve(true);
      }
    )
  })
}

function setWikilessCookies() {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "disableWikipedia",
        "wikipediaProtocol",
        "wikilessNormalRedirectsChecks",
        "wikilessNormalCustomRedirects",
        "wikilessTorRedirectsChecks",
        "wikilessTorCustomRedirects",
      ],
      r => {
        if (r.disableWikipedia || r.wikipediaProtocol === undefined) { resolve(); return; }
        let checkedInstances;
        if (r.wikipediaProtocol == 'normal') checkedInstances = [...r.wikilessNormalRedirectsChecks, ...r.wikilessNormalCustomRedirects]
        else if (r.wikipediaProtocol == 'tor') checkedInstances = [...r.wikilessTorRedirectsChecks, ...r.wikilessTorCustomRedirects]
        for (const to of checkedInstances) {
          utils.getCookiesFromStorage('wikiless', to, 'theme');
          utils.getCookiesFromStorage('wikiless', to, 'default_lang');
        }
        resolve();
      }
    )
  })
}

function redirect(url) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "disableWikipedia",
        "wikipediaRedirects",
        "wikipediaProtocol",

        "wikilessNormalRedirectsChecks",
        "wikilessTorRedirectsChecks",
        "wikilessI2pRedirectsChecks",
        "wikilessNormalCustomRedirects",
        "wikilessTorCustomRedirects",
        "wikilessI2pCustomRedirects",
      ],
      r => {
        if (r.disableWikipedia) { resolve(); return; }
        if (!targets.test(url.href)) { resolve(); return; }

        let GETArguments = [];
        if (url.search.length > 0) {
          let search = url.search.substring(1); //get rid of '?'
          let argstrings = search.split("&");
          for (let i = 0; i < argstrings.length; i++) {
            let args = argstrings[i].split("=");
            GETArguments.push([args[0], args[1]]);
          }
        }
        let instancesList;
        if (r.wikipediaProtocol == 'normal') instancesList = [...r.wikilessNormalRedirectsChecks, ...r.wikilessNormalCustomRedirects];
        else if (r.wikipediaProtocol == 'tor') instancesList = [...r.wikilessTorRedirectsChecks, ...r.wikilessTorCustomRedirects];
        else if (r.wikipediaProtocol == 'i2p') instancesList = [...r.wikilessI2pRedirectsChecks, ...r.wikilessI2pCustomRedirects];
        if (instancesList.length === 0) { resolve(); return; }
        let randomInstance = utils.getRandomInstance(instancesList)

        let link = `${randomInstance}${url.pathname}`;
        let urlSplit = url.host.split(".");
        if (urlSplit[0] != "wikipedia" && urlSplit[0] != "www") {
          if (urlSplit[0] == "m")
            GETArguments.push(["mobileaction", "toggle_view_mobile"]);
          else
            GETArguments.push(["lang", urlSplit[0]]);
          if (urlSplit[1] == "m")
            GETArguments.push(["mobileaction", "toggle_view_mobile"]);
          // wikiless doesn't have mobile view support yet
        }
        for (let i = 0; i < GETArguments.length; i++)
          link += (i == 0 ? "?" : "&") + GETArguments[i][0] + "=" + GETArguments[i][1];

        resolve(link);
      }
    )
  })
}

function switchInstance(url) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "wikipediaRedirects",
        "wikipediaProtocol",

        "wikilessNormalRedirectsChecks",
        "wikilessTorRedirectsChecks",

        "wikilessI2pRedirectsChecks",
        "wikilessNormalCustomRedirects",

        "wikilessTorCustomRedirects",
        "wikilessI2pCustomRedirects",
      ],
      r => {
        let protocolHost = utils.protocolHost(url);

        let wikipediaList = [
          ...r.wikipediaRedirects.wikiless.normal,
          ...r.wikipediaRedirects.wikiless.tor,
          ...r.wikipediaRedirects.wikiless.i2p,

          ...r.wikilessNormalCustomRedirects,
          ...r.wikilessTorCustomRedirects,
          ...r.wikilessI2pCustomRedirects
        ]
        if (!wikipediaList.includes(protocolHost)) resolve();

        let instancesList;
        if (r.wikipediaProtocol == 'normal') instancesList = [...r.wikilessNormalCustomRedirects, ...r.wikilessNormalRedirectsChecks];
        else if (r.wikipediaProtocol == 'tor') instancesList = [...r.wikilessTorCustomRedirects, ...r.wikilessTorRedirectsChecks];
        else if (r.wikipediaProtocol == 'i2p') instancesList = [...r.wikilessI2pCustomRedirects, ...r.wikilessI2pRedirectsChecks];

        let index = instancesList.indexOf(protocolHost);
        if (index > -1) instancesList.splice(index, 1);
        if (instancesList.length === 0) resolve();

        let randomInstance = utils.getRandomInstance(instancesList);
        resolve(`${randomInstance}${url.pathname}${url.search}`);
      }
    )
  })
}

function initDefaults() {
  return new Promise(resolve => {
    fetch('/instances/data.json').then(response => response.text()).then(async data => {
      let dataJson = JSON.parse(data);
      redirects.wikiless = dataJson.wikiless;
      browser.storage.local.get('cloudflareList', async r => {
        wikilessNormalRedirectsChecks = [...redirects.wikiless.normal];
        for (const instance of r.cloudflareList) {
          let i = wikilessNormalRedirectsChecks.indexOf(instance);
          if (i > -1) wikilessNormalRedirectsChecks.splice(i, 1);
        }
        await browser.storage.local.set({
          disableWikipedia: true,
          wikipediaRedirects: redirects,
          wikipediaProtocol: "normal",
          wikilessNormalRedirectsChecks: wikilessNormalRedirectsChecks,
          wikilessTorRedirectsChecks: [...redirects.wikiless.tor],
          wikilessI2pRedirectsChecks: [...redirects.wikiless.i2p],
          wikilessNormalCustomRedirects: [],
          wikilessTorCustomRedirects: [],
          wikilessI2pCustomRedirects: [],
        })
        resolve();
      })
    })
  })
}

export default {
  setRedirects,

  initWikilessCookies,
  setWikilessCookies,

  redirect,
  initDefaults,
  switchInstance,
};
