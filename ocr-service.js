var fs = require('fs'),
    express = require("express"),
    app = express(),
    multer = require('multer'),
    tesseract = require('node-tesseract'),
    tesseract_path = '/usr/local/bin/tesseract',
    aoc = require('./resources/aoc.json');

const PORT = 8081;

var options = {
    psm: 3,
    l: 'fra',
    binary: tesseract_path
};

function searchForAOC(ocr, result) {
    aoc.list.forEach(function (elem) {
        elem.aoc.forEach(function (aoc) {
            var regex = new RegExp(aoc.name, 'gi');
            if (regex.test(ocr)) {
                result.region = elem.region;
                result.aoc = aoc.name;
            }
        });
    });
}

function processOCR(image_path, options, res) {
    var stats = fs.statSync(image_path);
    var output = "";
    if (stats.isFile()) {
        tesseract.process(image_path, options, function (err, text) {
            if (err) {
                output = err;
            } else {
                output = text;
            }
            console.log('----------------------------------------------------');
            console.log(output);

            //need to process the output .... hum in a better way!
            var result = {};

            var regexYear = /[12][ ]*[09][ ]*[0-9 ]{2}/g;
            if (regexYear.test(output)) {
                regexYear = /[12][ ]*[09][ ]*[0-9 ]{2}/g;
                var match = regexYear.exec(output);
                result.year = match[0];
            }
            const regexCountry = /france/gi;
            if (regexCountry.test(output)) {
                result.country = "France";
            }

            searchForAOC(output, result);

            var regexName = /^.*(chateau|domaine).*$/mi;
            var m = regexName.exec(output)
            result.name = m[0];

            res.send(result);
        });
    }
}

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, 'last');
    }
});
var upload = multer({
    storage: storage
}).single('file');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/tmp.html");
});

app.post('/', function (req, res) {
    upload(req, res, function (err) {
        console.log(err);
        console.log("File is uploaded");
        var r = processOCR('./uploads/last', options, res);
    });
});


app.listen(3000, function () {
    console.log("Working on port 3000");
});