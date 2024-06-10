import { Router } from "express";
import multer from "multer";

// controllers
import addNewEvent from "../controllers/AddNewEvent.js";

const router = Router();

// Configura multer para usar memoryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFields = upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "Images" },
]);

// ver como mandar el cover con una imagen tambien

router.post("/create/event", uploadFields, addNewEvent);

export default router;
