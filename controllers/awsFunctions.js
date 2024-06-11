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
    // Usamos sharp para comprimir la imagen
    const compressedBuffer = await sharp(bufferFile)
      .resize({ width: 800 }) // Redimensiona la imagen a un ancho máximo de 800px (ajusta según sea necesario)
      .jpeg({ quality: 80 }) // Comprime la imagen JPEG con una calidad del 80% (ajusta según sea necesario)
      .toBuffer();
    const input = {
      ACL: "public-read",
      Body: compressedBuffer,
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
    const uploadPromises = fileList.map(async (file) => {
      const imagenSubida = await uploadImageToS3Bucket(
        file.buffer,
        file.originalname
      );
      return imagenSubida.imgLinkForDb; // Devuelve solo el link para el array final
    });
    const imageListUrls = await Promise.all(uploadPromises);

    return imageListUrls;
  } catch (error) {
    return { error };
  }
}
