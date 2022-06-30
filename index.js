var fs = require('fs');
var path = require('path');
var FolderPaths = [];
var KeywordReplacementData = [
  {
    Keyword: 'orange',
    Replacement: 'apple'
  },
  {
    Keyword: 'mango',
    Replacement: 'grapes'
  },
  {
    Keyword: 'cherry',
    Replacement: 'banana'
  }
];
var FinalResult = {
  ContentReplceCount: 0,
  FileNameReplaceCount: 0,
  FolderNameReplaceCount: 0
};


var readAndWriteFile = async function (element) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(element))
      return resolve("False");
    fs.readFile(element, 'utf8', async function (err, data) {
      if (err) {
        return console.log(err);
      }
      for (let index = 0; index < KeywordReplacementData.length; index++) {
        const keys = KeywordReplacementData[index];
        if (data.indexOf(keys.Keyword) > -1) {
          var mapObj = {};
          mapObj[keys.Keyword] = keys.Keyword;
          var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
          var count = data.split(' ')?.filter((x) => x.includes(keys.Keyword))?.length || 0;
          //FinalResult.ContentReplceCount += count;
          var result = data.replace(re, keys.Replacement);
          fs.writeFile(element, result, 'utf8', function (err) {
            if (err) return console.log(err);
            FinalResult.ContentReplceCount += count;
            if (KeywordReplacementData.length - 1 == index)
              return resolve("True");
          });
        } else {
          if (KeywordReplacementData.length - 1 == index)
            return resolve("False");
        }
      }
    });
  });
}

var TakeMatchedKeywordRecord = async function (Keyword) {
  return new Promise((resolve, reject) => {
    var res = KeywordReplacementData.filter((x) => x.Keyword == Keyword);
    if (res.length > 0) {
      return resolve(res);
    }
    else {
      return resolve([]);
    }
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
          //results.push(file);
          FolderPaths.push(file);
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

var FileDirectoryRename = async function (element, newPath, type) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(element))
      return resolve("False");
    fs.rename(element, newPath, function (err) {
      if (err) {
        //return 

        console.log("renamed failed ", err, element, newPath);
        return resolve();
      } else {
        if (type == "file")
          FinalResult.FileNameReplaceCount++;
        else
          FinalResult.FolderNameReplaceCount++;
        //console.log("Successfully renamed the File/directory.")
        return resolve();
      }
    })
  });
}

TakeFileAndFolderList(__dirname + '\\data', async function (err, results) {
  if (err) throw err;
  results = results.concat(FolderPaths.reverse());
  //console.log("Result is : ", results);
  for (let index = 0; index < results.length; index++) {
    const element = results[index];
    if (fs.existsSync(element) && !fs.lstatSync(element).isDirectory()) {
      var res = await readAndWriteFile(element);
      if (res == "True") {
        //console.log("Replaced containt");
        //FinalResult.ContentReplceCount++;
      }

      var filename = path.parse(element).name;
      var fileExt = path.parse(element).ext;
      var res = await TakeMatchedKeywordRecord(filename);
      if (res.length > 0) {
        res = res[0];
        var newPath = element.substr(0, element.lastIndexOf('\\')) + '\\' + res.Replacement + fileExt;
        // console.log('element File =>',element);
        // console.log('newPath File =>',newPath);
        await FileDirectoryRename(element, newPath, 'file');
      }
    } else {
      var directory = element.substr(element.lastIndexOf('\\') + 1, element.length);
      // console.log('directory =>',directory);
      var res = await TakeMatchedKeywordRecord(directory);
      if (res.length > 0) {
        res = res[0];
        var newPath = element.substr(0, element.lastIndexOf('\\')) + '\\' + res.Replacement;
        // console.log('element directory =>',element);
        // console.log('newPath directory =>',newPath);
        await FileDirectoryRename(element, newPath, 'folder');
      }
    }
  }
  console.log("FinalResult ", FinalResult);
});
