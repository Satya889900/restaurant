import express from "express";
import {
  submitContactForm,
  getPublicAdmins,
} from "../controllers/contactController.js";

const router = express.Router();

router.route("/").post(submitContactForm);
router.route("/admins").get(getPublicAdmins);

export default router;
