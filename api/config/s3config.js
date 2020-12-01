const AWS = require('aws-sdk');

console.log("process.env.NODE_ENV", process.env.NODE_ENV);
if(process.env.NODE_ENV !== "production") {
    AWS.config.update({
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETACCESSKEY,
        region: process.env.S3REGION,
    });
}

const s3= new AWS.S3();
const sns = new AWS.SNS();
module.exports = {
    s3: s3,
    sns: sns,
    bucketName:process.env.S3BUCKETNAME
};

