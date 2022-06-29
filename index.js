var fs = require('fs');
var path = require('path');
var Keyword = 'orange';
var Replacement = 'apple';
var FinalResult = {
  ContentReplceCount: 0,
  FileNameReplaceCount: 0,
  FolderNameReplaceCount: 0
};


var readAndWriteFile = async function (element) {
  return new Promise((resolve, reject) => {
    fs.readFile(element, 'utf8', async function (err, data) {
      if (err) {
        return console.log(err);
      }
      if (data.indexOf(Keyword) > -1) {
        var mapObj = {};
        mapObj[Keyword] = Keyword;
        var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
        var count = data.split(' ')?.filter((x) => x.includes(Keyword))?.length || 0;
        FinalResult.ContentReplceCount += count;
        var result = data.replace(re, Replacement);
        fs.writeFile(element, result, 'utf8', function (err) {
          if (err) return console.log(err);
          return resolve("True");
        });
      } else {
        return resolve("False");
      }
    });
  });
}

var TakeFileAndFolderList = async function (dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          results.push(file);
          TakeFileAndFolderList(file, function (err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

// var CheckFileRename = async function (element) {
//   return new Promise((resolve, reject) => {
//     var filename = path.parse(element).name;
//     var fileExt = path.parse(element).ext;
//     if (Keyword == filename) {
//       var newPath = element.substr(0, element.lastIndexOf('\\')) + '\\' + Replacement + fileExt;
//       // console.log('element File =>',element);
//       // console.log('newPath File =>',newPath);
//       fs.rename(element, newPath, function (err) {
//         if (err) {
//           return console.log(err);
//         } else {
//           FinalResult.FileNameReplaceCount++;
//           console.log("Successfully renamed the File.")
//           return resolve();
//         }
//       })
//     } else
//       return resolve();
//   });
// }

var FileDirectoryRename = async function (element, newPath, type) {
  return new Promise((resolve, reject) => {
    fs.rename(element, newPath, function (err) {
      if (err) {
        return console.log(err);
      } else {
        if(type == "file")
          FinalResult.FileNameReplaceCount++;
        else
          FinalResult.FolderNameReplaceCount++;
        console.log("Successfully renamed the File/directory.")
        return resolve();
      }
    })
  });
}

TakeFileAndFolderList(__dirname + '\\data', async function (err, results) {
  if (err) throw err;
  console.log("Result is : ", results.reverse());
  for (let index = 0; index < results.length; index++) {
    const element = results[index];
    if (!fs.statSync(element).isDirectory()) {
      var res = await readAndWriteFile(element);
      if (res == "True") {
        console.log("Replaced containt");
        //FinalResult.ContentReplceCount++;
      }
      var filename = path.parse(element).name;
      var fileExt = path.parse(element).ext;
      if (Keyword == filename) {
        var newPath = element.substr(0, element.lastIndexOf('\\')) + '\\' + Replacement + fileExt;
        // console.log('element File =>',element);
        // console.log('newPath File =>',newPath);
        await FileDirectoryRename(element, newPath, 'file');
      }
    } else {
      var directory = element.substr(element.lastIndexOf('\\') + 1, element.length);
      // console.log('directory =>',directory);
      if (Keyword == directory) {
        var newPath = element.substr(0, element.lastIndexOf('\\')) + '\\' + Replacement;
        // console.log('element directory =>',element);
        // console.log('newPath directory =>',newPath);
        await FileDirectoryRename(element, newPath, 'folder');
      }
    }
  }
  console.log("FinalResult ", FinalResult);
});
