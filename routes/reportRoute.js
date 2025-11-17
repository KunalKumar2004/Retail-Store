import express from 'express';
import Product from '../models/productModel.js';

const router = express.Router();

router.get('/reports', async (req, res) => {
    try {
        const stats = await Product.getDashboardStats();
        const categoryStats = await Product.getCategoryStats();
        
        res.render('reports', {
            title: 'Reports & Analytics',
            stats: stats,
            categoryStats: categoryStats
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.render('reports', {
            title: 'Reports & Analytics',
            stats: {},
            categoryStats: []
        });
    }
});

router.get('/reports/low-stock', async (req, res) => {
    try {
        const products = await Product.getLowStock();
        res.render('low-stock-report', {
            title: 'Low Stock Report',
            products: products
        });
    } catch (error) {
        console.error('Low stock report error:', error);
        res.render('low-stock-report', {
            title: 'Low Stock Report',
            products: []
        });
    }
});

router.get('/reports/inventory-value', async (req, res) => {
    try {
        const products = await Product.getInventoryValue();
        const totalValue = products.reduce((sum, product) => sum + parseFloat(product.total_value), 0);
        
        res.render('inventory-value-report', {
            title: 'Inventory Value Report',
            products: products,
            totalValue: totalValue
        });
    } catch (error) {
        console.error('Inventory value report error:', error);
        res.render('inventory-value-report', {
            title: 'Inventory Value Report',
            products: [],
            totalValue: 0
        });
    }
});

router.get('/reports/categories', async (req, res) => {
    try {
        const categories = await Product.getCategoryStats();
        res.render('category-report', {
            title: 'Category Analysis Report',
            categories: categories
        });
    } catch (error) {
        console.error('Category report error:', error);
        res.render('category-report', {
            title: 'Category Analysis Report',
            categories: []
        });
    }
});

export default router;