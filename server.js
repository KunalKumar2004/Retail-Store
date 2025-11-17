import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from './db.js';
import bodyParser from 'body-parser';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: 'retail-store-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== ROUTES ====================

// Home route - Redirect to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Login Routes - FIXED VERSION
app.get('/login', (req, res) => {
    // Only redirect to dashboard if user is already authenticated
    if (req.session.authenticated) {
        return res.redirect('/dashboard');
    }
    res.render('login', { 
        title: 'Login',
        error: null 
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Enhanced authentication
    if (username === 'admin' && password === 'admin123') {
        req.session.authenticated = true;
        req.session.user = { username: 'admin', role: 'administrator' };
        return res.redirect('/dashboard');
    } else {
        res.render('login', { 
            title: 'Login',
            error: 'Invalid username or password' 
        });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Dashboard route
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get various statistics
        const [[{ totalProducts }]] = await connection.execute('SELECT COUNT(*) as totalProducts FROM products');
        const [[{ lowStockProducts }]] = await connection.execute('SELECT COUNT(*) as lowStockProducts FROM products WHERE stock <= reorder_level AND stock > 0');
        const [[{ totalValue }]] = await connection.execute('SELECT COALESCE(SUM(stock * unit_price), 0) as totalValue FROM products');
        const [[{ outOfStock }]] = await connection.execute('SELECT COUNT(*) as outOfStock FROM products WHERE stock = 0');
        
        // Recent products
        const [recentProducts] = await connection.execute(`
            SELECT * FROM products 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        await connection.end();
        
        res.render('dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            stats: {
                totalProducts: totalProducts || 0,
                lowStockProducts: lowStockProducts || 0,
                totalValue: totalValue || 0,
                outOfStock: outOfStock || 0
            },
            recentProducts: recentProducts || []
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            stats: {
                totalProducts: 0,
                lowStockProducts: 0,
                totalValue: 0,
                outOfStock: 0
            },
            recentProducts: []
        });
    }
});

// Products list route
app.get('/products', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [products] = await connection.execute(`
            SELECT * FROM products ORDER BY created_at DESC
        `);
        await connection.end();
        
        res.render('products', { 
            title: 'Products Management',
            user: req.session.user,
            products: products || []
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('products', { 
            title: 'Products Management',
            user: req.session.user,
            products: []
        });
    }
});

// Add Product Form
app.get('/products/add', requireAuth, (req, res) => {
    res.render('add-product', { 
        title: 'Add New Product',
        user: req.session.user,
        product: null 
    });
});

// Edit Product Route - FIXED
app.get('/products/edit/:id', requireAuth, async (req, res) => {
    try {
        const productId = req.params.id;
        
        if (!productId || isNaN(productId)) {
            return res.redirect('/products');
        }
        
        const connection = await createConnection();
        const [products] = await connection.execute(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );
        await connection.end();
        
        if (products.length > 0) {
            res.render('edit-product', { 
                title: 'Edit Product',
                user: req.session.user,
                product: products[0] 
            });
        } else {
            req.session.message = { type: 'error', text: 'Product not found' };
            res.redirect('/products');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        req.session.message = { type: 'error', text: 'Error loading product' };
        res.redirect('/products');
    }
});

// Save Product (Add/Update)
app.post('/products/save', requireAuth, async (req, res) => {
    try {
        const { id, brand, name, stock, unit_price, reorder_level, category } = req.body;
        
        // Validation
        if (!brand || !name || !stock || !unit_price || !category) {
            req.session.message = { type: 'error', text: 'All fields are required' };
            return res.redirect(id ? `/products/edit/${id}` : '/products/add');
        }
        
        const connection = await createConnection();
        
        if (id) {
            // Update existing product
            await connection.execute(
                `UPDATE products SET brand=?, name=?, stock=?, unit_price=?, reorder_level=?, category=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                [brand.trim(), name.trim(), parseInt(stock), parseFloat(unit_price), parseInt(reorder_level) || 5, category.trim(), id]
            );
            req.session.message = { type: 'success', text: 'Product updated successfully' };
        } else {
            // Insert new product
            await connection.execute(
                `INSERT INTO products (brand, name, stock, unit_price, reorder_level, category) VALUES (?, ?, ?, ?, ?, ?)`,
                [brand.trim(), name.trim(), parseInt(stock), parseFloat(unit_price), parseInt(reorder_level) || 5, category.trim()]
            );
            req.session.message = { type: 'success', text: 'Product added successfully' };
        }
        
        await connection.end();
        res.redirect('/products');
    } catch (error) {
        console.error('Error saving product:', error);
        req.session.message = { type: 'error', text: 'Error saving product' };
        res.redirect(req.body.id ? `/products/edit/${req.body.id}` : '/products/add');
    }
});

// Delete Product with confirmation
app.post('/products/delete/:id', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
        await connection.end();
        
        if (result.affectedRows > 0) {
            req.session.message = { type: 'success', text: 'Product deleted successfully' };
        } else {
            req.session.message = { type: 'error', text: 'Product not found' };
        }
        
        res.redirect('/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.session.message = { type: 'error', text: 'Error deleting product' };
        res.redirect('/products');
    }
});

// Search Products
app.get('/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.redirect('/products');
        }
        
        const connection = await createConnection();
        
        let products;
        if (q === 'lowstock') {
            [products] = await connection.execute(
                'SELECT * FROM products WHERE stock <= reorder_level AND stock > 0 ORDER BY stock ASC'
            );
        } else if (q === 'outofstock') {
            [products] = await connection.execute(
                'SELECT * FROM products WHERE stock = 0 ORDER BY name'
            );
        } else {
            [products] = await connection.execute(
                `SELECT * FROM products 
                 WHERE name LIKE ? OR brand LIKE ? OR category LIKE ? 
                 ORDER BY name`,
                [`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`]
            );
        }
        
        await connection.end();
        res.render('products', { 
            title: q === 'lowstock' ? 'Low Stock Products' : 
                  q === 'outofstock' ? 'Out of Stock Products' : 
                  `Search Results for "${q}"`,
            user: req.session.user,
            products: products || [],
            searchQuery: q
        });
    } catch (error) {
        console.error('Search error:', error);
        res.redirect('/products');
    }
});

// Reports Dashboard
app.get('/reports', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        
        // Get report data
        const [[{ totalProducts }]] = await connection.execute('SELECT COUNT(*) as totalProducts FROM products');
        const [[{ lowStockCount }]] = await connection.execute('SELECT COUNT(*) as lowStockCount FROM products WHERE stock <= reorder_level AND stock > 0');
        const [[{ outOfStockCount }]] = await connection.execute('SELECT COUNT(*) as outOfStockCount FROM products WHERE stock = 0');
        const [[{ totalInventoryValue }]] = await connection.execute('SELECT COALESCE(SUM(stock * unit_price), 0) as totalInventoryValue FROM products');
        
        // Category-wise counts
        const [categoryStats] = await connection.execute('SELECT category, COUNT(*) as count FROM products GROUP BY category');

        await connection.end();

        res.render('reports', {
            title: 'Reports & Analytics',
            user: req.session.user,
            stats: {
                totalProducts: totalProducts || 0,
                lowStockCount: lowStockCount || 0,
                outOfStockCount: outOfStockCount || 0,
                totalInventoryValue: totalInventoryValue || 0
            },
            categoryStats: categoryStats || []
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.render('reports', {
            title: 'Reports & Analytics',
            user: req.session.user,
            stats: {},
            categoryStats: []
        });
    }
});

// Low Stock Report
app.get('/reports/low-stock', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [products] = await connection.execute(`
            SELECT * FROM products 
            WHERE stock <= reorder_level AND stock > 0
            ORDER BY stock ASC, name ASC
        `);
        await connection.end();

        res.render('low-stock-report', {
            title: 'Low Stock Report',
            user: req.session.user,
            products: products || []
        });
    } catch (error) {
        console.error('Low stock report error:', error);
        res.render('low-stock-report', {
            title: 'Low Stock Report',
            user: req.session.user,
            products: []
        });
    }
});

// Inventory Value Report
app.get('/reports/inventory-value', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [products] = await connection.execute(`
            SELECT *, (stock * unit_price) as total_value 
            FROM products 
            ORDER BY total_value DESC
        `);
        
        const [[{ totalValue }]] = await connection.execute('SELECT COALESCE(SUM(stock * unit_price), 0) as totalValue FROM products');
        
        await connection.end();

        res.render('inventory-value-report', {
            title: 'Inventory Value Report',
            user: req.session.user,
            products: products || [],
            totalValue: totalValue || 0
        });
    } catch (error) {
        console.error('Inventory value report error:', error);
        res.render('inventory-value-report', {
            title: 'Inventory Value Report',
            user: req.session.user,
            products: [],
            totalValue: 0
        });
    }
});

// Category Report
app.get('/reports/categories', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [categories] = await connection.execute(`
            SELECT 
                category,
                COUNT(*) as product_count,
                COALESCE(SUM(stock), 0) as total_stock,
                COALESCE(SUM(stock * unit_price), 0) as total_value,
                COALESCE(AVG(unit_price), 0) as avg_price
            FROM products 
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY total_value DESC
        `);
        
        await connection.end();

        res.render('category-report', {
            title: 'Category Analysis Report',
            user: req.session.user,
            categories: categories || []
        });
    } catch (error) {
        console.error('Category report error:', error);
        res.render('category-report', {
            title: 'Category Analysis Report',
            user: req.session.user,
            categories: []
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Retail Store Management System',
        version: '1.0.0'
    });
});

// Debug endpoint
app.get('/debug/products', requireAuth, async (req, res) => {
    try {
        const connection = await createConnection();
        const [products] = await connection.execute('SELECT * FROM products');
        await connection.end();
        
        res.json({
            totalProducts: products.length,
            products: products
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// ==================== ERROR HANDLERS ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found',
        user: req.session.user
    });
});

// Error Handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).render('500', {
        title: 'Server Error',
        user: req.session.user,
        error: process.env.NODE_ENV === 'development' ? error : {}
    });
});

// ==================== SERVER STARTUP ====================

// Start server
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`🏪 Retail Store Management System Running 🚀`);
        console.log(`📍 http://localhost:${port}`);
        console.log(`📊 Database: MySQL on port 3307`);
        console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
        console.log(`=========================================`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`❌ Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
    
    return server;
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server terminated');
    process.exit(0);
});

// Start the server
startServer(PORT);

export default app;