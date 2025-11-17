import express from "express";
import {
  getProducts,
  showAddProduct,
  addProduct,
  showEditProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/add", showAddProduct);
router.post("/add", addProduct);
router.get("/edit/:id", showEditProduct);
router.post("/edit/:id", updateProduct);
router.get("/delete/:id", deleteProduct);

export default router;
