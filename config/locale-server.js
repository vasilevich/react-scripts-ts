const fs = require('fs');
const glob = require('glob');
const translate = require('google-translate-api');
const express = require('express');
const path = require('path');
const router = express.Router();
const paths = require('./paths');
const PATHS = {
  root: path.resolve(paths.appPath),
  nodeModules: path.resolve(paths.appNodeModules),
  src: path.resolve(paths.appSrc),
  dist: path.resolve(paths.appBuild),
  assets: path.resolve(paths.appPublic, './assets'),
  locale: path.resolve(paths.appPublic, './assets/locale'),
  localeDefaultLanguage: path.resolve(paths.appPublic, './assets/locale/default.json'),
};

router.get('/api/translate', (req, res) => {
  if (!(req.query.lang && req.query.word)) {
    return res.send(
      "valid request example: /api/translate?lang=iw&word=hello");
  }
  fs.mkdir(PATHS.assets, () => (fs.mkdir(PATHS.locale, () => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json');
    const save = (path, obj) => fs.writeFileSync(path, JSON
      .stringify(
        obj, null, '  '), 'utf8');
    const read = (path) => {
      try {
        return JSON.parse(fs.readFileSync(path))
      } catch (e) {
        return {};
      }
    };
    const learnNewDefaultWord = (word, defaultContent) => {
      if (!(word in defaultContent)) {
        let newDefaultContent = defaultContent;
        newDefaultContent[word] = word;
        save(PATHS.localeDefaultLanguage,
          newDefaultContent);
      }
    };
    const lang = req.query.lang.toLowerCase();
    const langFile = `${lang}.json`;
    const chosenFile = path.join(PATHS.locale, langFile);
    const word = req.query.word;
    const trans = (word) => translate(word, {
      // from: 'en',
      to: lang
    });
    glob(path.join(PATHS.locale, '*.json'), (err, list) => {
      list = list.map((p) => (path.normalize(p)));
      if (!list.includes(chosenFile)) { // no language file, create one to avoid nulls
        save(chosenFile, {});
      }
      const defaultContent = read(PATHS.localeDefaultLanguage);
      const content = read(chosenFile);
      if (word in content) {
        learnNewDefaultWord(word, defaultContent);
        return res.json({lang, word, result: content[word]});
      } else if (list.find((file) => (file === PATHS.localeDefaultLanguage)) &&
        word in defaultContent) {
        //translate and teach the original language file.
        //and return...
        Promise.all(
          Object.keys(defaultContent)
            .filter((key) => !Object.keys(content).includes(
              key))
            .map((key) =>
              trans(defaultContent[key])
                .then(res => {
                  const o = {};
                  o[key] = res.text.replace(
                    /[\u0591-\u05C7]/g,
                    '');
                  return o;
                }).catch(err => {
                console.error(err);
                return res.json(err);
              })
            ))
          .then((results) => {
            let obj = {
              ...content
            };
            results.forEach((result) => obj = {
              ...obj,
              ...result
            });
            save(chosenFile, obj);
            return res.json({lang, word, result: obj[word]});
          });
      } else {
        //default translations dont exsist too, create both.
        learnNewDefaultWord(word, defaultContent);
        if (!PATHS.localeDefaultLanguage.endsWith(
            langFile)) {
          trans(word).then(googleResponse => {
            const obj = read(chosenFile);
            obj[word] = googleResponse.text.replace(
              /[\u0591-\u05C7]/g, '');
            save(chosenFile, obj);
            return res.json({lang, word, result: obj[word]});
          }).catch(err => {
            console.error(err);
            return res.json(err);
          });
        }
      }
    });


  })));
});

router.get('/assets/:localePath/:fileName', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Expires', '-1');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Content-Type', 'application/json');
  fs.readFile(path.join(path.resolve(PATHS.assets, req.params.localePath), req.params.fileName), function (err, contents) {
    if (!err && contents) {
      res.setHeader('Content-Length', contents.length);
      res.end(contents);
    }
    else if(err.code&&err.code==="ENOENT"){
      const empty = JSON.stringify({}, null, "\t");
      res.writeHead(200);
      res.end(empty);
    }
    else {
      const error = JSON.stringify(err, null, "\t");
      res.writeHead(500);
      res.end(error);
    }
  });
});

module.exports = (app) => app.use(router);
