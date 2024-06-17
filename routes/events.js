import { Router } from "express";
import multer from "multer";

// controllers
import { addNewEvent, EditEventImageList } from "../controllers/AddNewEvent.js";

const router = Router();

// Configura multer para usar memoryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadFields = upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "Images" },
]);

const uploadFieldsForEditEvent = upload.fields([{ name: "Images" }]);
// ver como mandar el cover con una imagen tambien

router.post("/create/event", uploadFields, addNewEvent);
router.patch(
  "/edit/event/imagelist/:id",
  uploadFieldsForEditEvent,
  EditEventImageList
);

export default router;
