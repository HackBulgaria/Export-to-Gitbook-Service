var express = require("express")
var app = express()
var bodyParser = require('body-parser');
var fs  = require("fs")
var util = require("util")
var os = require("os");
var sys = require('sys')
var exec = require('child_process').exec;
var archiver = require('archiver');
var path = require('path');
var mime = require('mime');

app.use(bodyParser());

book_id = 1;
BOOKS_REPOSITORY = "books/"

var saveBook = function(payload) {
    readmeFile = "README.md";
    summaryFile = "SUMMARY.md";
    book_folder = "book" + book_id;
    path = BOOKS_REPOSITORY + book_folder
    fs.mkdirSync(path)

    fs.writeFileSync(path + "/" + readmeFile, payload.introduction)

    payload.chapters.forEach(function(chapter) {
        chapterPath = path + "/" + chapter.chapterFile
        fs.writeFileSync(chapterPath, chapter.chapterContent)
    });

    chapters = payload.chapters;
    chapters = chapters.map(function(chapter) {
        return util.format("* [%s](%s)", chapter.chapterName, chapter.chapterFile)
    });
    console.log(chapters)
    var summaryContent = util.format("#Summary \n\n%s", chapters.join("\n"))

    fs.writeFileSync(path + "/" + summaryFile, summaryContent)
    return book_id
};

var generateBook = function(bookId) {
    var child;
    var command = "gitbook build %s --output=%s/output"
    var bookPath = "books/book" + bookId
    command = util.format(command, bookPath, bookPath)
    child = exec(command, function (error, stdout, stderr) {
      sys.print('stdout: ' + stdout);
      sys.print('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
};

var viewBook = function(bookId, cb) {
    var path_to_zip = "books/book" + bookId + "/book.zip"
    var path_to_book = "books/book" + bookId + "/output"
    var output = fs.createWriteStream(path_to_zip)
    var archive = archiver("zip")

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    archive.on('error', function(err){
        throw err;
    });

    archive.pipe(output);
    archive.bulk([
        { expand: true,
        src: ['**'], cwd: path_to_book}
    ]);
    archive.finalize();

    output.on("finish", function() {
        cb(path_to_zip)
    })
};

app.post("/generate_book", function(req, res) {
    var bookId = saveBook(req.body)
    generateBook(bookId)
    var fullUrl = req.protocol + '://' + req.get('host');
    console.log(fullUrl)
    previewUrl = fullUrl + "/   view_book/" + bookId

    book_id += 1;

    res.json({
        previewUrl : previewUrl
    })
});

app.get("/view_book/:bookId", function(req, res) {
    viewBook(req.params.bookId, function(file) {
        res.download(file)
    })
});


app.listen(3000)
console.log("App is listening at port 3000")
