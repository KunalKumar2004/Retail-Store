import Database from '../config/db.js';

class Supplier {
    static async getAll() {
        try {
            const connection = await Database.getConnection();
            const [rows] = await connection.execute('SELECT * FROM suppliers ORDER BY name');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        try {
            const connection = await Database.getConnection();
            const [rows] = await connection.execute('SELECT * FROM suppliers WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async create(supplierData) {
        try {
            const { name, contact, email, phone, address } = supplierData;
            const connection = await Database.getConnection();
            const [result] = await connection.execute(
                'INSERT INTO suppliers (name, contact, email, phone, address) VALUES (?, ?, ?, ?, ?)',
                [name, contact, email, phone, address]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, supplierData) {
        try {
            const { name, contact, email, phone, address } = supplierData;
            const connection = await Database.getConnection();
            const [result] = await connection.execute(
                'UPDATE suppliers SET name=?, contact=?, email=?, phone=?, address=? WHERE id=?',
                [name, contact, email, phone, address, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const connection = await Database.getConnection();
            const [result] = await connection.execute('DELETE FROM suppliers WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

export default Supplier;