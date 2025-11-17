import express from "express";
import {
    getSuppliers,
    showAddSupplier,
    addSupplier,
    showEditSupplier,
    updateSupplier,
    deleteSupplier
} from "../controllers/supplierController.js";

const router = express.Router();

router.get("/", getSuppliers);
router.get("/add", showAddSupplier);
router.post("/add", addSupplier);
router.get("/edit/:id", showEditSupplier);
router.post("/edit/:id", updateSupplier);
router.get("/delete/:id", deleteSupplier);

export default router;
