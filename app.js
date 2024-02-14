const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name
  },
});

const cache = {};

// Function to search for a filename in the CSV file
function searchInCSV(filename, callback) {
  // Check if the result is cached
  if (cache[filename]) {
    return callback(cache[filename]);
  }

  // If not cached, read from the CSV file
  fs.createReadStream("datasets.csv")
    .pipe(csv())
    .on("data", (row) => {
      if (row.Image === filename) {
        cache[filename] = row.Results;
        callback(row.Results);
      }
    })
    .on("end", () => {
      if (!cache[filename]) {
        callback(null); // If filename not found
      }
    });
}

const upload = multer({ storage: storage });

app.post("/", upload.single("inputFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filename = path.parse(req.file.filename).name;

  searchInCSV(filename, (results) => {
    if (results) {
      res.send(`${filename}:${results}`);
    } else {
      res.status(404).send("Results not found for the uploaded file.");
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
