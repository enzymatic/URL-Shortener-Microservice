require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const validUrl = require('valid-url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

console.log(process.env.PORT);

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.DB_URI);

let urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

let UrlModel = mongoose.model('Url', urlSchema);

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

function randomUrlcode() {
  let randomString = 'askd23048asdi19712ndsda801923';
  let subStr = '';

  for (let i = 0; i < 5; i++) {
    subStr += randomString[Math.floor(Math.random() * randomString.length)];
  }

  return subStr;
}

app.post('/api/shorturl', async function (req, res) {
  const { url } = req.body;

  if (validUrl.isUri(url)) {
    try {
      let inDatabase = await UrlModel.findOne({
        original_url: url,
      });

      if (inDatabase) {
        res.json({
          original_url: inDatabase.original_url,
          short_url: inDatabase.short_url,
        });
      } else {
        inDatabase = new UrlModel({
          original_url: url,
          short_url: randomUrlcode(),
        });
        await inDatabase.save();
        res.json({
          original_url: inDatabase.original_url,
          short_url: inDatabase.short_url,
        });
      }
    } catch (error) {
      res.json({ error: 'something went wrong' });
    }
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:url?', async function (req, res) {
  try {
    const { url } = req.params;

    let inDatabase = await UrlModel.findOne({
      short_url: url,
    });
    if (inDatabase) {
      res.redirect(inDatabase.original_url);
    } else {
      res.json({ error: 'Not found' });
    }
  } catch (error) {
    res.json({ error: 'invalid uri' });
  }
});

app.use((error, res, req, next) => {
  console.log('error handler', error);
  res.json({ error });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
