
// Module laden
var process = require("child_process"),
	system = require('system'),
	fs = require('fs'),
	page = require('webpage').create();

// Alias
var execFile = process.execFile;

// Variablen
var prefix = "http://www.hanser-elibrary.com",
	downloadCounter = 0,
	fileCounter = 0;

function getNextNumber() {
	fileCounter++;
	return prefixNumberString(fileCounter.toString(), "0", 2);
}

function prefixNumberString(num, prefix, minLength) {
	var tempNum = num;
	while (tempNum.length < minLength) {
		tempNum = prefix + tempNum;
	}
	return tempNum;
}

// Parameter-Check
if (system.args.length < 3) {
	console.log('invalid call - url is missing');
	phantom.exit();
}

// URL und Zielverzeichnis aus den Parametern holen
var url = system.args[1];
var targetDir = system.args[2];

// Verzeichnis für die PDF-Dateien anlegen
fs.makeDirectory(targetDir);

page.open(url, function(status) {
	console.log("Status = " + status);
	if (status === "success") {
		// nach den Download-Links für die PDF-Dateien suchen
		var matches = page.content.match(/\/doi\/pdf\/(.*?)(\d|\/|\.|fm)*">PDF/g);
		for (var i = 0; i < matches.length; i++) {
			// Url zusammenbauen, Prefix hinzufuegen, Ende (>PDF) entfernen
			matches[i] = prefix + matches[i].substring(0, matches[i].length - 5) + "?download=true";
			downloadFile(matches[i]);
		}
	}
});

function getFileName(fileUrl) {
	var tempArray = fileUrl.split('/');
	return tempArray[tempArray.length - 1];
}

function downloadFile(fileUrl) {
	var fileName = getNextNumber() + "_" +  getFileName(fileUrl) + ".pdf";
	downloadCounter++;
	console.log("downloading " + fileUrl + "\n");
	execFile("curl", ["-L", "-o", targetDir + fs.separator +  fileName, fileUrl, "-c", "cookies.txt"], null, function (err, stdout, stderr) {
		//console.log("STDOUT: " + JSON.stringify(stdout));
		//console.log("STDERR: " + JSON.stringify(stderr));
		downloadCounter--;
	});
}

var interval = setInterval(function () {
	if (downloadCounter === 0) {
		console.log("\nNo more running downloads - exit\n");
		// Remove the cookie file
		if (fs.exists("cookies.txt")) {
			console.log("Removing cookies.txt");
			fs.remove("cookies.txt");	
		}
		console.log("\n\n" + targetDir + " wurde heruntergeladen.");
		phantom.exit();
	} else {
		console.log("\nWarte auf Download Ende - " + downloadCounter + " laufende Downloads");
	}
}, 7500);
