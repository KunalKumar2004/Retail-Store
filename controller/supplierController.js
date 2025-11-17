import Supplier from '../models/supplierModel.js';

class SupplierController {
    static async getSuppliers(req, res) {
        try {
            const suppliers = await Supplier.getAll();
            res.render('supplier', {
                title: 'Supplier Management',
                suppliers: suppliers
            });
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            res.render('supplier', {
                title: 'Supplier Management',
                suppliers: [],
                error: 'Failed to load suppliers'
            });
        }
    }

    static showAddForm(req, res) {
        res.render('add-supplier', {
            title: 'Add New Supplier',
            supplier: null
        });
    }

    static async showEditForm(req, res) {
        try {
            const supplier = await Supplier.getById(req.params.id);
            if (supplier) {
                res.render('add-supplier', {
                    title: 'Edit Supplier',
                    supplier: supplier
                });
            } else {
                res.redirect('/suppliers');
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
            res.redirect('/suppliers');
        }
    }

    static async saveSupplier(req, res) {
        try {
            const { id, name, contact, email, phone, address } = req.body;
            
            if (id) {
                await Supplier.update(id, { name, contact, email, phone, address });
            } else {
                await Supplier.create({ name, contact, email, phone, address });
            }
            
            res.redirect('/suppliers');
        } catch (error) {
            console.error('Error saving supplier:', error);
            res.redirect('/suppliers');
        }
    }

    static async deleteSupplier(req, res) {
        try {
            await Supplier.delete(req.params.id);
            res.redirect('/suppliers');
        } catch (error) {
            console.error('Error deleting supplier:', error);
            res.redirect('/suppliers');
        }
    }
}

export default SupplierController;