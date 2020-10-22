const AWS = require('aws-sdk');
const s3= new AWS.S3();

module.exports = {
    s3: s3,
    bucketName: process.env.S3BUCKETNAME
};