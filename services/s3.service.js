const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3");

const uploadVideo = async (file, folder = "Videos") => {
    if (!file) {
        throw new Error("No file");
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `${folder}/${fileName}`;

    const upload = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3Client.send(upload);
    return key;
};

const deleteFromS3 = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    await s3Client.send(command);
};

const getVideoUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
};

module.exports = {
    uploadVideo,
    deleteFromS3,
    getVideoUrl
};
