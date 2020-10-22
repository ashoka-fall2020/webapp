const fs = require('fs');
const s3 = require('../config/s3config');
const db = require("../models");
const File = db.file;

exports.uploadFileForQuestion = async function (request, file) {
    console.log("upload file for question");
    file.file_name = request.file.originalname;
    file.s3_object_name = request.file.filename;
    const params = {
        Bucket      : s3.bucketName,
        Key         :  request.file.filename
    };
    const metaData = await s3.s3.headObject(params).promise();
    console.log(metaData);
    file.accept_ranges = metaData.AcceptRanges;
    file.content_length = metaData.ContentLength;
    file.e_tag = metaData.ETag;
    file.content_type = metaData.ContentType;
    const newFile = new File(file);
    return newFile.save();
};

exports.uploadFileForAnswer = async function (request, file) {
    console.log("upload file for answer");
    file.file_name = request.file.originalname;
    file.s3_object_name = request.file.filename;
    const params = {
        Bucket      : s3.bucketName,
        Key         :  request.file.filename
    };
    const metaData = await s3.s3.headObject(params).promise();
    console.log(metaData);
    file.accept_ranges = metaData.AcceptRanges;
    file.content_length = metaData.ContentLength;
    file.e_tag = metaData.ETag;
    file.content_type = metaData.ContentType;
    const newFile = new File(file);
    return newFile.save();
};

exports.uploadFileToS3 = function(request) {
    let fileData = fs.readFileSync(request.file.path);
    const putParams = {
        Bucket      : s3.bucketName,
        Key         :  request.file.filename,
        Body        :  fileData
    };
    return s3.s3.putObject(putParams).promise();
};

exports.getFileDetails = function(request) {
    const promise = File.findOne({
        where:{file_id: request.params.file_id}
    });
    return promise;
};

exports.deleteFileFromS3 = function(file) {
    const params = {
        Bucket      : s3.bucketName,
        Key         :  file.s3_object_name,
    };
    return s3.s3.deleteObject(params).promise();
};

exports.deleteFileDetails = function(file) {
    const promise = File.destroy({
        where:{file_id: file.file_id}
    });
    return promise;
};