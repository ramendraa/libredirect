window.browser = window.browser || window.chrome;

import utils from '../utils.js'

const targets = [
  /^https?:\/{2}translate\.google(\.[a-z]{2,3}){1,2}\//,
];

let redirects = {
  "simplyTranslate": {
    "normal": [],
    "tor": []
  },
  "lingva": {
    "normal": [],
    "tor": []
  }
};

let
  simplyTranslateNormalRedirectsChecks,
  lingvaNormalRedirectsChecks;

function setRedirects(val) {
  browser.storage.local.get('cloudflareList', r => {
    redirects = val;
    simplyTranslateNormalRedirectsChecks = [...redirects.simplyTranslate.normal];
    lingvaNormalRedirectsChecks = [...redirects.lingva.normal]
    for (const instance of r.cloudflareList) {
      const a = simplyTranslateNormalRedirectsChecks.indexOf(instance);
      if (a > -1) simplyTranslateNormalRedirectsChecks.splice(a, 1);

      const b = lingvaNormalRedirectsChecks.indexOf(instance);
      if (b > -1) lingvaNormalRedirectsChecks.splice(b, 1);
    }
    browser.storage.local.set({
      translateRedirects: redirects,
      simplyTranslateNormalRedirectsChecks,
      simplyTranslateTorRedirectsChecks: redirects.simplyTranslate.tor,
      lingvaNormalRedirectsChecks,
      lingvaTorRedirectsChecks: redirects.lingva.tor,
    })
  })
}

function initLingvaLocalStorage(test, url, tabId) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "translateDisable",
        "translateProtocol",
        "translateFrontend",
        "lingvaNormalRedirectsChecks",
        "lingvaNormalCustomRedirects",
        "lingvaTorRedirectsChecks",
        "lingvaTorCustomRedirects",
      ],
      r => {
        if (r.translateDisable || r.translateFrontend != 'lingva') { resolve(); return; }
        const protocolHost = utils.protocolHost(url);
        if (![
          ...r.lingvaNormalRedirectsChecks,
          ...r.lingvaNormalCustomRedirects,
          ...r.lingvaTorRedirectsChecks,
          ...r.lingvaTorCustomRedirects,
        ].includes(protocolHost)) { resolve(); return; }

        if (!test) {
          browser.tabs.executeScript(
            tabId,
            { file: "/assets/javascripts/helpers/translate/get_lingva_preferences.js", runAt: "document_start" }
          );

          let checkedInstances;
          if (r.translateProtocol == 'normal') checkedInstances = [...r.lingvaNormalRedirectsChecks, ...r.lingvaNormalCustomRedirects];
          if (r.translateProtocol == 'tor') checkedInstances = [...r.lingvaTorRedirectsChecks, ...r.lingvaTorCustomRedirects];
          const i = checkedInstances.indexOf(protocolHost);
          if (i !== -1) checkedInstances.splice(i, 1);
          if (checkedInstances.length === 0) { resolve(); return; }
          for (const to of checkedInstances)
            browser.tabs.create(
              { url: to },
              tab => browser.tabs.executeScript(tab.id, { file: "/assets/javascripts/helpers/translate/set_lingva_preferences.js", runAt: "document_start" })
            );
        }
        resolve(true);
      }
    )
  })
}

function initSimplyTranslateCookies(test, from) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "translateProtocol",
        "simplyTranslateNormalRedirectsChecks",
        "simplyTranslateNormalCustomRedirects",
        "simplyTranslateTorRedirectsChecks",
        "simplyTranslateTorCustomRedirects",
        "simplyTranslateI2pRedirectsChecks",
        "simplyTranslateI2pCustomRedirects",
      ],
      r => {
        let protocolHost = utils.protocolHost(from);
        if (![
          ...r.simplyTranslateNormalRedirectsChecks,
          ...r.simplyTranslateNormalCustomRedirects,
          ...r.simplyTranslateTorRedirectsChecks,
          ...r.simplyTranslateTorCustomRedirects,
        ].includes(protocolHost)) { resolve(); return; }
        if (!test) {
          let checkedInstances;
          if (r.translateProtocol == 'normal') checkedInstances = [...r.simplyTranslateNormalRedirectsChecks, ...r.simplyTranslateNormalCustomRedirects]
          else if (r.translateProtocol == 'tor') checkedInstances = [...r.simplyTranslateTorRedirectsChecks, ...r.simplyTranslateTorCustomRedirects]
          for (const to of checkedInstances) {
            utils.copyCookie('simplyTranslate', from, to, 'from_lang');
            utils.copyCookie('simplyTranslate', from, to, 'to_lang');
            utils.copyCookie('simplyTranslate', from, to, 'tts_enabled');
            utils.copyCookie('simplyTranslate', from, to, 'use_text_fields');
          }
        }
        resolve(true);
      }
    )
  })
}

function setSimplyTranslateCookies() {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "translateProtocol",
        "translateDisable",
        "translateFrontend",
        "simplyTranslateNormalRedirectsChecks",
        "simplyTranslateNormalCustomRedirects",
        "simplyTranslateTorRedirectsChecks",
        "simplyTranslateTorCustomRedirects",
      ],
      r => {
        if (r.translateDisable || r.translateFrontend != 'simplyTranslate') { resolve(); return; }
        let checkedInstances;
        if (r.translateProtocol == 'normal') checkedInstances = [...r.simplyTranslateNormalRedirectsChecks, ...r.simplyTranslateNormalCustomRedirects]
        else if (r.translateProtocol == 'tor') checkedInstances = [...r.simplyTranslateTorRedirectsChecks, ...r.simplyTranslateTorCustomRedirects]
        for (const to of checkedInstances) {
          utils.getCookiesFromStorage('simplyTranslate', to, 'from_lang');
          utils.getCookiesFromStorage('simplyTranslate', to, 'to_lang');
          utils.getCookiesFromStorage('simplyTranslate', to, 'tts_enabled');
          utils.getCookiesFromStorage('simplyTranslate', to, 'use_text_fields');
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
        "translateDisable",
        "translateFrontend",
        "translateProtocol",
        "translateRedirects",

        "simplyTranslateNormalRedirectsChecks",
        "simplyTranslateNormalCustomRedirects",
        "simplyTranslateTorRedirectsChecks",
        "simplyTranslateTorCustomRedirects",

        "lingvaNormalRedirectsChecks",
        "lingvaNormalCustomRedirects",
        "lingvaTorRedirectsChecks",
        "lingvaTorCustomRedirects",
      ],
      r => {
        if (r.translateDisable) { resolve(); return; };
        if (!targets.some(rx => rx.test(url.href))) { resolve(); return; };

        if (r.translateFrontend == 'simplyTranslate') {
          let instancesList;
          if (r.translateProtocol == 'normal') instancesList = [...r.simplyTranslateNormalRedirectsChecks, ...r.simplyTranslateNormalCustomRedirects];
          if (r.translateProtocol == 'tor') instancesList = [...r.simplyTranslateTorRedirectsChecks, ...r.simplyTranslateTorCustomRedirects];
          if (instancesList.length === 0) { resolve(); return; };

          let randomInstance = utils.getRandomInstance(instancesList)
          resolve(`${randomInstance}/${url.search}`);
        }
        else if (r.translateFrontend == 'lingva') {
          let params_arr = url.search.split('&');
          params_arr[0] = params_arr[0].substring(1);
          let params = {};
          for (let i = 0; i < params_arr.length; i++) {
            let pair = params_arr[i].split('=');
            params[pair[0]] = pair[1];
          }
          let instancesList;
          if (r.translateProtocol == 'normal') instancesList = [...r.lingvaNormalRedirectsChecks, ...r.lingvaNormalCustomRedirects];
          if (r.translateProtocol == 'tor') instancesList = [...r.lingvaTorRedirectsChecks, ...r.lingvaTorCustomRedirects];
          if (instancesList.length === 0) { resolve(); return; }

          let randomInstance = utils.getRandomInstance(instancesList)
          if (params.sl && params.tl && params.text) {
            resolve(`${randomInstance}/${params.sl}/${params.tl}/${params.text}`); return;
          }
          resolve(randomInstance);
        }
      }
    )
  })
}

function switchInstance(url) {
  return new Promise(resolve => {
    browser.storage.local.get(
      [
        "translateDisable",
        "translateFrontend",
        "translateProtocol",
        "translateRedirects",

        "simplyTranslateNormalRedirectsChecks",
        "simplyTranslateNormalCustomRedirects",
        "simplyTranslateTorRedirectsChecks",
        "simplyTranslateTorCustomRedirects",

        "lingvaNormalRedirectsChecks",
        "lingvaNormalCustomRedirects",
        "lingvaTorRedirectsChecks",
        "lingvaTorCustomRedirects",
      ],
      r => {
        if (r.translateDisable) { resolve(); return; };
        const protocolHost = utils.protocolHost(url);
        if (![
          ...r.translateRedirects.simplyTranslate.normal,
          ...r.translateRedirects.simplyTranslate.tor,

          ...r.simplyTranslateNormalCustomRedirects,
          ...r.simplyTranslateTorCustomRedirects,

          ...r.translateRedirects.lingva.normal,
          ...r.translateRedirects.lingva.tor,

          ...r.lingvaNormalCustomRedirects,
          ...r.lingvaTorCustomRedirects,
        ].includes(protocolHost)) { resolve(); return; }

        let instancesList;
        if (r.translateProtocol == 'normal') {
          if (r.translateFrontend == 'simplyTranslate') instancesList = [...r.simplyTranslateNormalRedirectsChecks, ...r.simplyTranslateNormalCustomRedirects];
          else if (r.translateFrontend == 'lingva') instancesList = [...r.lingvaNormalRedirectsChecks, ...r.lingvaNormalCustomRedirects];
        }
        else if (r.translateProtocol == 'tor') {
          if (r.translateFrontend == 'simplyTranslate') instancesList = [...r.simplyTranslateTorRedirectsChecks, ...r.simplyTranslateTorCustomRedirects];
          else if (r.translateFrontend == 'lingva') instancesList = [...r.lingvaTorRedirectsChecks, ...r.lingvaTorCustomRedirects];
        }

        const index = instancesList.indexOf(protocolHost);
        if (index > -1) instancesList.splice(index, 1);
        if (instancesList.length === 0) { resolve(); return; }

        let randomInstance = utils.getRandomInstance(instancesList);
        resolve(`${randomInstance}${url.pathname}${url.search}`);
      })
  })
}

function initDefaults() {
  return new Promise(async resolve => {
    fetch('/instances/data.json').then(response => response.text()).then(data => {
      let dataJson = JSON.parse(data);
      redirects.simplyTranslate = dataJson.simplyTranslate;
      redirects.lingva = dataJson.lingva;
      browser.storage.local.get('cloudflareList',
        async r => {
          simplyTranslateNormalRedirectsChecks = [...redirects.simplyTranslate.normal];
          lingvaNormalRedirectsChecks = [...redirects.lingva.normal]
          for (const instance of r.cloudflareList) {
            const a = simplyTranslateNormalRedirectsChecks.indexOf(instance);
            if (a > -1) simplyTranslateNormalRedirectsChecks.splice(a, 1);

            const b = lingvaNormalRedirectsChecks.indexOf(instance);
            if (b > -1) lingvaNormalRedirectsChecks.splice(b, 1);
          }
          await browser.storage.local.set({
            translateDisable: false,
            translateFrontend: "simplyTranslate",
            translateProtocol: 'normal',
            translateRedirects: redirects,

            simplyTranslateNormalRedirectsChecks: simplyTranslateNormalRedirectsChecks,
            simplyTranslateNormalCustomRedirects: [],
            simplyTranslateTorRedirectsChecks: [...redirects.simplyTranslate.tor],
            simplyTranslateTorCustomRedirects: [],

            lingvaNormalRedirectsChecks: lingvaNormalRedirectsChecks,
            lingvaNormalCustomRedirects: [],
            lingvaTorRedirectsChecks: [...redirects.lingva.tor],
            lingvaTorCustomRedirects: [],
          })
          resolve();
        })
    })
  })
}

export default {
  initSimplyTranslateCookies,
  setSimplyTranslateCookies,
  initLingvaLocalStorage,

  setRedirects,

  redirect,
  initDefaults,
  switchInstance,
};
