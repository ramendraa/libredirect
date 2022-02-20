window.browser = window.browser || window.chrome;

import commonHelper from './common.js'

const targets = [
  "reddit.com",
  "www.reddit.com",
  "np.reddit.com",
  "new.reddit.com",
  "amp.reddit.com",
  "i.redd.it",
  "redd.it",
];
let redirects = {
  // modern UI
  "libreddit": {
    "normal": [
      "https://libredd.it",
      "https://libreddit.spike.codes",
      "https://libreddit.kavin.rocks",
      "https://libreddit.insanity.wtf",
      "https://libreddit.dothq.co",
      "https://libreddit.silkky.cloud",
      "https://reddit.artemislena.eu",
      "https://reddit.git-bruh.duckdns.org",
    ]
  },
  // old UI
  "teddit": {
    "normal": [
      "https://teddit.net",
      "https://teddit.ggc-project.de",
      "https://teddit.kavin.rocks",
      "https://teddit.zaggy.nl",
      "https://teddit.namazso.eu",
      "https://teddit.nautolan.racing",
      "https://teddit.tinfoil-hat.net",
      "https://teddit.domain.glass",
      "https://snoo.ioens.is",
      "https://teddit.httpjames.space",
      "https://teddit.alefvanoon.xyz",
      "https://incogsnoo.com",
      "https://teddit.pussthecat.org",
      "https://reddit.lol",
      "https://teddit.sethforprivacy.com",
      "https://teddit.totaldarkness.net",
      "https://teddit.adminforge.de",
      "https://teddit.bus-hit.me"
    ],
    "tor": [
      "http://teddit4w6cmzmj5kimhfcavs7yo5s7alszvsi2khqutqtlaanpcftfyd.onion",
      "http://snoo.ioensistjs7wd746zluwixvojbbkxhr37lepdvwtdfeav673o64iflqd.onion",
      "http://ibarajztopxnuhabfu7fg6gbudynxofbnmvis3ltj6lfx47b6fhrd5qd.onion",
      "http://tedditfyn6idalzso5wam5qd3kdtxoljjhbrbbx34q2xkcisvshuytad.onion",
      "http://dawtyi5e2cfyfmoht4izmczi42aa2zwh6wi34zwvc6rzf2acpxhrcrad.onion",
      "http://qtpvyiaqhmwccxwzsqubd23xhmmrt75tdyw35kp43w4hvamsgl3x27ad.onion"
    ]
  },
  "desktop": "https://old.reddit.com", // desktop
  "mobile": "https://i.reddit.com", // mobile
};
const getRedirects = () => redirects;
const getCustomRedirects = function () {
  return {
    "libreddit": {
      "normal": [...libredditNormalRedirectsChecks, ...libredditNormalCustomRedirects]
    },
    "teddit": {
      "normal": [...tedditNormalRedirectsChecks, ...tedditNormalCustomRedirects]
    }
  };
};

function setLibredditRedirects(val) {
  redirects.libreddit = val;
  browser.storage.sync.set({ redditRedirects: redirects })
  console.log("libredditRedirects:", val)
  for (const item of libredditNormalRedirectsChecks)
    if (!redirects.libreddit.normal.includes(item)) {
      var index = libredditNormalRedirectsChecks.indexOf(item);
      if (index !== -1) libredditNormalRedirectsChecks.splice(index, 1);
    }
  setLibredditNormalRedirectsChecks(libredditNormalRedirectsChecks);
}

function setTedditRedirects(val) {
  redirects.teddit = val;
  browser.storage.sync.set({ redditRedirects: redirects })
  console.log("tedditRedirects:", val)
  for (const item of tedditNormalRedirectsChecks)
    if (!redirects.teddit.normal.includes(item)) {
      var index = tedditNormalRedirectsChecks.indexOf(item);
      if (index !== -1) tedditNormalRedirectsChecks.splice(index, 1);
    }
  setTedditNormalRedirectsChecks(tedditNormalRedirectsChecks);
}


let libredditNormalRedirectsChecks;
const getLibredditNormalRedirectsChecks = () => libredditNormalRedirectsChecks;
function setLibredditNormalRedirectsChecks(val) {
  libredditNormalRedirectsChecks = val;
  browser.storage.sync.set({ libredditNormalRedirectsChecks })
  console.log("libredditNormalRedirectsChecks: ", val)
}

let libredditNormalCustomRedirects = [];
const getLibredditNormalCustomRedirects = () => libredditNormalCustomRedirects;
function setLibredditNormalCustomRedirects(val) {
  libredditNormalCustomRedirects = val;
  browser.storage.sync.set({ libredditNormalCustomRedirects })
  console.log("libredditNormalCustomRedirects: ", val)
}

let tedditNormalRedirectsChecks;
const getTedditNormalRedirectsChecks = () => tedditNormalRedirectsChecks;
function setTedditNormalRedirectsChecks(val) {
  tedditNormalRedirectsChecks = val;
  browser.storage.sync.set({ tedditNormalRedirectsChecks })
  console.log("tedditNormalRedirectsChecks: ", val)
}

let tedditNormalCustomRedirects = [];
const getTedditNormalCustomRedirects = () => tedditNormalCustomRedirects;
function setTedditNormalCustomRedirects(val) {
  tedditNormalCustomRedirects = val;
  browser.storage.sync.set({ tedditNormalCustomRedirects })
  console.log("tedditNormalCustomRedirects: ", val)
}

const bypassPaths = /\/(gallery\/poll\/rpan\/settings\/topics)/;

let disableReddit;
const getDisableReddit = () => disableReddit;
function setDisableReddit(val) {
  disableReddit = val;
  browser.storage.sync.set({ disableReddit })
}

let redditFrontend;
const getRedditFrontend = () => redditFrontend;
function setRedditFrontend(val) {
  redditFrontend = val;
  browser.storage.sync.set({ redditFrontend })
};

function isReddit(url, initiator) {
  if (
    initiator &&
    (
      [...redirects.libreddit.normal, ...libredditNormalCustomRedirects].includes(initiator.origin) ||
      [...redirects.teddit.normal, ...tedditNormalCustomRedirects].includes(initiator.origin) ||
      targets.includes(initiator.host)
    )
  ) return false;
  return targets.includes(url.host)
}

function redirect(url, type) {
  if (disableReddit) return null;

  if (type !== "main_frame" || url.pathname.match(bypassPaths)) return null;

  let libredditInstancesList = [...libredditNormalRedirectsChecks, ...libredditNormalCustomRedirects];
  let tedditInstancesList = [...tedditNormalRedirectsChecks, ...tedditNormalCustomRedirects];

  if (url.host === "i.redd.it") {
    if (libredditInstancesList.length === 0) return null;
    let libredditRandomInstance = commonHelper.getRandomInstance(libredditInstancesList);
    // As of 2021-04-09, redirects for teddit images are nontrivial:
    // - navigating to the image before ever navigating to its page causes
    //   404 error (probably needs fix on teddit project)
    // - some image links on teddit are very different
    // Therefore, don't support redirecting image links for teddit.
    return `${libredditRandomInstance}/img${url.pathname}${url.search}`;
  }
  else if (url.host === "redd.it") {
    if (redditFrontend == 'libreddit') {
      if (libredditInstancesList.length === 0) return null;
      let libredditRandomInstance = commonHelper.getRandomInstance(libredditInstancesList);
      return `${libredditRandomInstance}${url.pathname}${url.search}`;
    }
    if (redditFrontend == 'teddit' && !url.pathname.match(/^\/+[^\/]+\/+[^\/]/)) {
      if (tedditInstancesList.length === 0) return null;
      let tedditRandomInstance = commonHelper.getRandomInstance(tedditInstancesList);
      // As of 2021-04-22, redirects for teddit redd.it/foo links don't work.
      // It appears that adding "/comments" as a prefix works, so manually add
      // that prefix if it is missing. Even though redd.it/comments/foo links
      // don't seem to work or exist, guard against affecting those kinds of
      // paths.
      // Note the difference between redd.it/comments/foo (doesn't work) and
      // teddit.net/comments/foo (works).
      return `${tedditRandomInstance}/comments${url.pathname}${url.search}`;
    }
  }
  if (redditFrontend == 'libreddit') {
    if (libredditInstancesList.length === 0) return null;
    let libredditRandomInstance = commonHelper.getRandomInstance(libredditInstancesList);
    return `${libredditRandomInstance}${url.pathname}${url.search}`;
  }
  if (redditFrontend == 'teddit') {
    if (tedditInstancesList.length === 0) return null;
    let tedditRandomInstance = commonHelper.getRandomInstance(tedditInstancesList);
    return `${tedditRandomInstance}${url.pathname}${url.search}`;
  }
}

async function init() {
  return new Promise((resolve) => {
    browser.storage.sync.get(
      [
        "disableReddit",
        "redditFrontend",
        "redditRedirects",
        "libredditNormalRedirectsChecks",
        "libredditNormalCustomRedirects",
        "tedditNormalRedirectsChecks",
        "tedditNormalCustomRedirects",
      ], (result) => {
        disableReddit = result.disableReddit ?? false;
        redditFrontend = result.redditFrontend ?? 'libreddit';
        if (result.redditRedirects)
          redirects = result.redditRedirects;

        libredditNormalRedirectsChecks = result.libredditNormalRedirectsChecks ?? [...redirects.libreddit.normal];
        libredditNormalCustomRedirects = result.libredditNormalCustomRedirects ?? [];

        tedditNormalRedirectsChecks = result.tedditNormalRedirectsChecks ?? [...redirects.teddit.normal];
        tedditNormalCustomRedirects = result.tedditNormalCustomRedirects ?? [];

        resolve();
      }
    )
  })
}

export default {
  targets,
  getRedirects,
  getCustomRedirects,
  setTedditRedirects,
  setLibredditRedirects,

  getDisableReddit,
  setDisableReddit,

  getRedditFrontend,
  setRedditFrontend,

  getLibredditNormalRedirectsChecks,
  setLibredditNormalRedirectsChecks,

  getLibredditNormalCustomRedirects,
  setLibredditNormalCustomRedirects,

  getTedditNormalRedirectsChecks,
  setTedditNormalRedirectsChecks,

  getTedditNormalCustomRedirects,
  setTedditNormalCustomRedirects,

  redirect,
  isReddit,
  init,
};
