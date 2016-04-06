// based on https://github.com/jprichardson/node-fs-extra/ copySync

var fs = require('graceful-fs');
var path = require('path');

var BUF_LENGTH = 64 * 1024;
var _buff = new Buffer(BUF_LENGTH);
function copyFile(srcFile, destFile) {

  if(fs.existsSync(destFile) ) {
    return;
  }

  var fdr = fs.openSync(srcFile, 'r');
  var stat = fs.fstatSync(fdr);
  var fdw = fs.openSync(destFile, 'w', stat.mode);
  var bytesRead = 1;
  var pos = 0;

  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }

  fs.closeSync(fdr);
  fs.closeSync(fdw);
}

function copy(src, dest) {

  var stats = fs.statSync(src); //fs.lstatSync(src);
  var destFolder = path.dirname(dest);
  var destFolderExists = fs.existsSync(destFolder);;
  var performCopy = false;

  if (stats.isFile()) {
    if (!destFolderExists) {
      console.log('dosentExisit');
      mkdirs(destFolder);
    }
      console.log(src, dest, destFolder, destFolderExists);

    copyFile(src, dest);

  } else if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      mkdirs(dest);
    }
    var contents = fs.readdirSync(src);

    contents.forEach(function (content) {
      copyFile( path.join(src, content), path.join(dest, content) );
    });

  } else if (stats.isSymbolicLink()) {
    var srcPath = fs.readlinkSync(src);
    fs.symlinkSync(srcPath, dest);
  }
}


var o777 = parseInt('0777', 8)
function mkdirs (_path, opts, made) {
  console.log('mkdirs');
  if (!opts || typeof opts !== 'object') {
    opts = { mode: opts };
  }

  var mode = opts.mode;
  var xfs = opts.fs || fs;

  if (mode === undefined) {
    mode = o777 & (~process.umask());
  }
  if (!made) {
    made = null;
  }

  _path = path.resolve(_path);

  try {
    xfs.mkdirSync(_path, mode)
    made = made || _path;
  } catch (err0) {

    switch (err0.code) {
      case 'ENOENT' :
        made = mkdirs(path.dirname(_path), opts, made);
        mkdirs(_path, opts, made);
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        var stat;
        try {
          stat = xfs.statSync(_path);
        } catch (err1) {
          throw err0;
        }
        if (!stat.isDirectory()) {
          throw err0;
        }
        break;
    }
  }

  return made;
}

module.exports = copy;