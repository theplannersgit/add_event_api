import {
  uploadImageToS3Bucket,
  uploadBatchImagesToS3,
} from "./awsFunctions.js";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addNewEvent = async (req, res) => {
  // validacion para que traiga todas la images
  try {
    const eventImageList = await processUploadImagesForEvent(req.files.Images);
    const coverImg = await processCoverImage(req.files.cover[0]);

    // usar prisma con la misma data connection, crear evento
    const eventoCreado = await prisma.evento.create({
      data: {
        nombre: req.body.nombre,
        portada: coverImg.coverImg.imgLinkForDb,
        image: eventImageList.multipleImages,
      },
    });
    return res.status(200).json(eventoCreado);
  } catch (error) {
    console.log(error);
    return res.json({ error });
  }
};

const processCoverImage = async (file) => {
  try {
    const coverImg = await uploadImageToS3Bucket(
      file.buffer,
      file.originalname
    );
    return { coverImg, status: 200 };
  } catch (error) {
    console.log(error);
    return error;
  }
};

const processUploadImagesForEvent = async (files) => {
  try {
    if (files.length === 1) {
      const uploadedImg = await uploadImageToS3Bucket(
        files[0].buffer,
        files[0].originalname
      );
      return { uploadedImg, status: 200 };
    }
    // Mas de 1 imagen
    else if (files.length > 1) {
      const multipleImages = await uploadBatchImagesToS3(files);
      return { multipleImages, status: 200 };
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

export default addNewEvent;
