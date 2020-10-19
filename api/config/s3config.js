//setting the credentials
//The region should be the region of the bucket that you created
//Visit this if you have any confusion - https://docs.aws.amazon.com/general/latest/gr/rande.html
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: "AKIAIR2XVGNPSBULO54Q",
    secretAccessKey: "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",
    region: "us-east-1",
});

const s3= new AWS.S3();

module.exports = s3;