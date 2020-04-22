const express = require("express");
var app = express();

const bodyParser = require('body-parser');
const path = require('path');

var moment = require('moment');

const request = require("request");
const cheerio = require("cheerio");

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Local Veritabanı Ayarları Yapıldı
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ subscribers: [], count: 0 }).write();


/* Ana Sayfa */
app.get('/', (req, res) => {

    // Goruntulenme Sayisi Bir Artirildi
    db.update('count', n => n + 1).write();
    const count = db.get("count").write();

    // Dolar Verilerini Cektik
    request("https://www.mynet.com/", (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            const response = $("p.liveName").text();
            var dolarkur = response.substring(0, 5);
            var date = moment().format("DD.MM.YYYY h:mm");
            res.render('main.ejs', { count: count, dolarkur: dolarkur, date: date });
        }
    });
})

/* Abone Olma Post Islemi */
app.post("/abone", (req, res) => {
    if (req.body.name.length > 3 || req.body.email.length > 3) {
        db.get('subscribers')
            .push({ name: req.body.name, mail: req.body.email })
            .write();
        res.render("success.ejs", { state : "Abone Olma Basarili"});
    } else {
        res.render("success.ejs", { state : "Abone Olma Basarisiz"});
    }
});

/* Api Kullanim Sayfasi */
app.get("/apikullanim", (req, res) => {
    res.render("api.ejs");
});

/* Api Sayfasi */
app.get("/api", (req, res) => {

    const dolar = {
        kur: "Dolar",
        deger: "",
        tarih: ""
    }

    const euro = {
        kur: "Euro",
        deger: "",
        tarih: ""
    }

    const altin = {
        kur: "Altın",
        deger: "",
        tarih: ""
    }

    const bist = {
        kur: "Borsa İstanbul",
        deger: "",
        tarih: ""
    }

    const kurlar = [];

    request("https://www.mynet.com/", (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            const response = $("p.liveName").text();

            var dolarkur = response.substring(0, 5);
            var eurokur = response.substring(6, 11);
            var altinkur = response.substring(12, 18);
            var bistkur = response.substring(18, 24);

            dolar.deger = dolarkur;
            dolar.tarih = moment().format("DD.MM.YYYY, h:mm:ss a");

            euro.deger = eurokur;
            euro.tarih = moment().format("DD.MM.YYYY, h:mm:ss a");

            altin.deger = altinkur;
            altin.tarih = moment().format("DD.MM.YYYY, h:mm:ss a");

            bist.deger = bistkur;
            bist.tarih = moment().format("DD.MM.YYYY, h:mm:ss a");

            kurlar.push(dolar);
            kurlar.push(euro);
            kurlar.push(altin);
            kurlar.push(bist);

            res.json(kurlar);
        }
    });
})


app.listen(3000, () => {
    console.log("Uygulama Su Portta Calistirildi : 3000");
});