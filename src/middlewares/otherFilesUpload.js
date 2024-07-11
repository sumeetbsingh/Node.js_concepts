require("dotenv").config({ path: "./../../.env" });
const express = require("express");
const { S3 } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multers3 = require("multer-s3");
const multer = require("multer");
const path = require("path");

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multers3({
  s3: s3,
  bucket: "gmtesting",
  key: (req, file, cb) => {
    const folderPath = `students/`;
    const ext = file.originalname.split(".")[1];
    const filename = `students_data-${Date.now()}.${ext}`;
    cb(null, `${folderPath}${filename}`);
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /pdf|xlsx|xls/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(`ERROR: File type not supported!`);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
