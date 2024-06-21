import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

import { config } from "dotenv";
config();

const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCES_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const validateFile = (imgName) => {
  return (
    !imgName.endsWith(".png") &&
    !imgName.endsWith(".PNG") &&
    !imgName.endsWith(".jpg") &&
    !imgName.endsWith(".JPG") &&
    !imgName.endsWith(".jpeg") &&
    !imgName.endsWith(".JPEG")
  );
};

export async function uploadImageToS3Bucket(bufferFile, imgName) {
  try {
    if (validateFile(imgName)) {
      throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
    }

    const input = {
      ACL: "public-read",
      Body: bufferFile,
      Bucket: "eventosfotos",
      Key: `eventosplanners/${imgName}`,
      ContentType: "image/jpeg", // Especifica el tipo de contenido aquí
    };

    const command = new PutObjectCommand(input);
    const awsResponse = await client.send(command);
    const response = {
      message: awsResponse.$metadata,
      imgLinkForDb: `https://eventosfotos.s3.amazonaws.com/eventosplanners/${imgName}`,
    };
    return response;
  } catch (error) {
    return { error };
  }
}

export async function uploadBatchImagesToS3(fileList) {
  try {
    let imageListUrls = [];

    for (let i = 0; i < fileList.length; i++) {
      const uploadPromises = fileList.map(async (file) => {
        const imagenSubida = await uploadImageToS3Bucket(
          file.buffer,
          file.originalname
        );
        return imagenSubida.imgLinkForDb; // Devuelve solo el link para el array final
      });

      const batchResults = await Promise.all(uploadPromises);
      imageListUrls = batchResults;
    }
    return imageListUrls;
  } catch (error) {
    return { error: error.message };
  }
}
