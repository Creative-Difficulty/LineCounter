import readline from "readline"
import logger from "node-color-log"
import fs from "fs"
import util from "util";
import cliProgress from "cli-progress";
import chalk from "chalk";
import { exit } from "process";
import path from "path";

logger.setLevel("success")
var FolderORFilePath = "node_modules";
const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile);
const lStat = util.promisify(fs.lstat)

process.argv.shift()
process.argv.shift()

if(process.argv.includes("-v")) {
    console.log("v0.1")
} else if((process.argv.includes("-version"))) {
    console.log("v0.1")
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
        return ans;
    }));
};

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

var FolderORFilePath = await askQuestion("Path to file/folder (You can use global file paths): ")
var FolderORFileData = await lStat(FolderORFilePath).catch((e) => {logger.error("An error occurred while scanning the directory/file: " + e.message); exit(1)});

if(FolderORFileData.isDirectory()) {
    logger.info("The given path is a valid directory path");
    const FilesinFolder = await readDir(FolderORFilePath);
    logger.info("Number of files in selected directory: " + FilesinFolder.length);
    logger.info("Directory was last modified at: " + new Date(FolderORFileData.mtime * 1000))
    logger.info("Size of the directory: " + bytesToSize(FolderORFileData.size));
    for(let i=0; i<FilesinFolder.length; i++) {
        var skipThisIteration = false;
        var FilePath = path.join(FolderORFilePath, FilesinFolder[i])
        var FileData = await lStat(FilePath).catch((e) => {console.log(chalk.red(FilesinFolder[i] + " is a directory, unable to scan it." + e.message)); skipThisIteration = true; return});
        if(skipThisIteration === true) {
            continue;
        }
        if(FileData.isDirectory()) {
            //TODO: display summary: time taken: XXms files scanned: XX
            //TODO: scan files in subfolders and display a tree view
            console.log(chalk.red(FilesinFolder[i] + " is a directory, unable to scan it."));
        } else if(FileData.isFile()) {
            //console.log(chalk.greenBright(FilesinFolder[i] + " is a file, scanning it."));
            var FileContents = await readFile(FilePath, "utf-8")
            logger.success("File " + FilesinFolder[i] + " at path " + FolderORFilePath + " Read successfully")
            //console.log(FileContents.split(/\r\n|\r|\n/).length);
        } else {
            console.log(chalk.red(FilesinFolder[i] + " is not readable in UTF-8, unable to scan it."));
        }
    }
} else if(FolderORFileData.isFile()){
    const FileBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    FileBar.start(200, 0);
    logger.info("The given path is a valid file path");
    const FileContents = await readFile(FolderORFilePath, "utf-8")
    logger.success("File at path " + FolderORFilePath + "Read successfully")
    console.log(FileContents.split(/\r\n|\r|\n/).length);
} else {
    logger.error("The given path is not a valid path!");
    exit(1);
}

