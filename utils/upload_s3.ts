import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { fromEnv } from "@aws-sdk/credential-providers"; // ES6 import
import fs from "fs"
import config from "../crawler/config.json" assert {type:"json"}

// Create an S3 client with credentials loaded from environment variables
const s3Client = new S3Client({
    region: config.SCREENSHOT_AWS_REGION,
    credentials: fromEnv(),
});

export async function uploadToS3(sourcePath:string, toPath:string) {

    const file = Bun.file(sourcePath);
    const uploadParams = {
        Bucket: config.SCREENSHOT_BUCKET,
        Key: toPath,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: "image/jpeg"
    };

    /*try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("File uploaded successfully:", data);
    } catch (err) {
        console.error("Error uploading file:", err);
    }*/

    return s3Client.send(new PutObjectCommand(uploadParams))
}