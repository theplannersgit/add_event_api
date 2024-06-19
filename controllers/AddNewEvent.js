import {
  uploadImageToS3Bucket,
  uploadBatchImagesToS3,
} from "./awsFunctions.js";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addNewEvent = async (req, res) => {
  // validacion para que traiga todas la images
  try {
    const eventImageList = await processUploadImagesForEvent(req.files.Images);
    const coverImg = await processCoverImage(req.files.cover[0]);
    if (coverImg.coverImg.error) {
      throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
    }
    if (eventImageList.error) {
      throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
    }
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
    return res.status(500).json({ error });
  }
};

export const EditEventImageList = async (req, res) => {
  const addImageList = req.files.Images;
  const eventId = req.params.id;
  if (!eventId) {
    throw new Error("envia un id en el url ");
  }
  try {
    const evento = await prisma.evento.findUnique({
      where: { id: eventId },
    });

    if (!evento) {
      return res.status(500).json({ error: "no se encuentra el evento" });
    }
    // si hay evento entonces que haga la transformacion de las imagenes en links
    const imageListToBeAdded = await processUploadImagesForEvent(addImageList);

    if (imageListToBeAdded.error) {
      throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
    }

    if (imageListToBeAdded.imagen === "single") {
      const addSingleImageToEvent = [
        ...evento.image,
        imageListToBeAdded.uploadedImg.imgLinkForDb,
      ];
      const updatedEventoSingle = await prisma.evento.update({
        where: { id: eventId },
        data: { image: addSingleImageToEvent },
      });

      return res.status(200).json({
        updatedEventoSingle,
        newImages: imageListToBeAdded.uploadedImg.imgLinkForDb,
      });
    }

    if (imageListToBeAdded.imagen === "multiple") {
      const newImagesForEvent = imageListToBeAdded.multipleImages;

      const updatedImageEvents = [...evento.image, ...newImagesForEvent];

      const updatedEvento = await prisma.evento.update({
        where: { id: eventId },
        data: { image: updatedImageEvents },
      });
      return res
        .status(200)
        .json({ updatedEvento, newImages: newImagesForEvent });
    }
  } catch (error) {
    return res.status(500).json({ error: error });
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
      if (uploadedImg.error) {
        throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
      }
      return { uploadedImg, status: 200, imagen: "single" };
    } else if (files.length > 1) {
      const multipleImages = await uploadBatchImagesToS3(files);
      if (multipleImages.includes(undefined)) {
        throw new Error("Solo puedes subir imágenes en formato JPG o PNG");
      }
      return { multipleImages, status: 200, imagen: "multiple" };
    }
  } catch (error) {
    return { error: error.message };
  }
};
