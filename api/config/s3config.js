const AWS = require('aws-sdk');

console.log("process.env.ENV1", process.env.NODE_ENV);
if(process.env.NODE_ENV !== "production") {
    AWS.config.update({
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETACCESSKEY,
        region: process.env.S3REGION,
    });
}

const s3= new AWS.S3();
module.exports = {
    s3: s3,
    bucketName:process.env.S3BUCKETNAME
};