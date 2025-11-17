import connection from "../db.js";

// List products
export const getProducts = (req, res) => {
  connection.query("SELECT * FROM products ORDER BY product_id DESC", (err, results) => {
    if (err) return res.send(err);
    res.render("products", { products: results });
  });
};

// Show add product form
export const showAddProduct = (req, res) => {
  res.render("addProduct", { product: null });
};

// Add new product
export const addProduct = (req, res) => {
  const { name, category, brand, stock, unit_price, reorder_level } = req.body;
  connection.query(
    "INSERT INTO products (name, category, brand, stock, unit_price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)",
    [name, category, brand, stock, unit_price, reorder_level],
    (err, result) => {
      if (err) return res.send(err);
      res.redirect("/products");
    }
  );
};

// Show edit product form
export const showEditProduct = (req, res) => {
  const { id } = req.params;
  connection.query("SELECT * FROM products WHERE product_id = ?", [id], (err, results) => {
    if (err) return res.send(err);
    res.render("addProduct", { product: results[0] });
  });
};

// Update product
export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, category, brand, stock, unit_price, reorder_level } = req.body;
  connection.query(
    "UPDATE products SET name=?, category=?, brand=?, stock=?, unit_price=?, reorder_level=? WHERE product_id=?",
    [name, category, brand, stock, unit_price, reorder_level, id],
    (err, result) => {
      if (err) return res.send(err);
      res.redirect("/products");
    }
  );
};

// Delete product
export const deleteProduct = (req, res) => {
  const { id } = req.params;
  connection.query("DELETE FROM products WHERE product_id=?", [id], (err, result) => {
    if (err) return res.send(err);
    res.redirect("/products");
  });
};
