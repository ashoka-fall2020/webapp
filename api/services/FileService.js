const fs = require('fs');
const s3 = require('../config/s3config');
const db = require("../models");
const File = db.file;

exports.uploadFileForQuestion = async function (request, file) {
    console.log("upload file for question");
    file.file_name = request.file.originalname;
    file.s3_object_name = request.file.filename;
    const params = {
        Bucket      : 'eg-sample-bucket',
        Key         :  request.file.filename
    };
    const metaData = await s3.headObject(params).promise();
    console.log(metaData);
    const newFile = new File(file);
    return newFile.save();
};

exports.uploadFileToS3 = function(request) {
    let fileData = fs.readFileSync(request.file.path);
    const putParams = {
        Bucket      : 'eg-sample-bucket',
        Key         :  request.file.filename,
        Body        :  fileData
    };
    console.log("s3 success");
    return s3.putObject(putParams).promise();
};

exports.getFileDetails = function(request) {
    const promise = File.findOne({
        where:{file_id: request.params.file_id}
    });
    return promise;
};

exports.deleteFileFromS3 = function(file) {
    const params = {
        Bucket      : 'eg-sample-bucket',
        Key         :  file.s3_object_name,
    };
    return s3.deleteObject(params).promise();
};

exports.deleteFileDetails = function(file) {
    const promise = File.destroy({
        where:{file_id: file.file_id}
    });
    return promise;
};