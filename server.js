const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


let db;

// Inicializar la base de datos SQLite en un archivo local
async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Transacciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            tipo_movimiento TEXT NOT NULL,
            monto REAL NOT NULL,
            cuenta_destino TEXT NOT NULL,
            usuario_id TEXT
        );
    `);
}

// Función 2: Calcular_Saldos
async function Calcular_Saldos() {
    // Operación 1: Calcular "Fondo Comunal"
    const fondoRows = await db.all(`SELECT tipo_movimiento, monto FROM Transacciones WHERE cuenta_destino = 'Fondo Comunal'`);
    let total_fondo_comunal = 0;
    
    for (const row of fondoRows) {
        if (row.tipo_movimiento === 'Depósito' || row.tipo_movimiento === 'Pago_Capital') {
            total_fondo_comunal += row.monto;
        } else if (row.tipo_movimiento === 'Préstamo' || row.tipo_movimiento === 'Retiro') {
            total_fondo_comunal -= row.monto;
        }
    }

    // Operación 2: Calcular "Rendimientos"
    const rendRows = await db.all(`SELECT tipo_movimiento, monto FROM Transacciones WHERE cuenta_destino = 'Rendimiento'`);
    let total_rendimiento = 0;

    for (const row of rendRows) {
        if (row.tipo_movimiento === 'Interés' || row.tipo_movimiento === 'Multa') {
            total_rendimiento += row.monto;
        }
    }

    // Gran Total
    const gran_total_caja = total_fondo_comunal + total_rendimiento;

    // Retornamos los totales calculados
    return {
        total_fondo_comunal: parseFloat(total_fondo_comunal.toFixed(2)),
        total_rendimiento: parseFloat(total_rendimiento.toFixed(2)),
        gran_total_caja: parseFloat(gran_total_caja.toFixed(2))
    };
}

// ===================================
// Endpoints (API)
// ===================================

// GET /api/saldos -> Expone la Función 2
app.get('/api/saldos', async (req, res) => {
    try {
        const saldos = await Calcular_Saldos();
        res.json(saldos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/transacciones -> Expone la Función 1
app.post('/api/transacciones', async (req, res) => {
    try {
        const { tipo_movimiento, monto, usuario_id } = req.body;

        // Regla A: Validar que el monto sea mayor a 0
        if (monto === undefined || typeof monto !== 'number' || monto <= 0) {
            return res.status(400).json({ error: "El monto debe ser mayor a cero" });
        }

        // Lógica de Clasificación
        const tiposFondo = ["Depósito", "Préstamo", "Retiro", "Pago_Capital"];
        const tiposRendimiento = ["Interés", "Multa"];
        let cuenta_destino = "";

        if (tiposFondo.includes(tipo_movimiento)) {
            cuenta_destino = "Fondo Comunal";
        } else if (tiposRendimiento.includes(tipo_movimiento)) {
            cuenta_destino = "Rendimiento";
        } else {
            return res.status(400).json({ error: "Tipo de movimiento no válido. Valores aceptados: Depósito, Préstamo, Retiro, Pago_Capital, Interés, Multa." });
        }

        // Regla B: Validar Préstamo o Retiro vs Total_Fondo_Comunal
        if (tipo_movimiento === 'Préstamo' || tipo_movimiento === 'Retiro') {
            const saldosActuales = await Calcular_Saldos();
            if (monto > saldosActuales.total_fondo_comunal) {
                return res.status(400).json({ error: "Fondos insuficientes en el Fondo Comunal" });
            }
        }

        // Acción en Base de Datos (Guardar)
        const result = await db.run(
            `INSERT INTO Transacciones (tipo_movimiento, monto, cuenta_destino, usuario_id) VALUES (?, ?, ?, ?)`,
            [tipo_movimiento, monto, cuenta_destino, usuario_id || null]
        );

        res.status(201).json({
            mensaje: "Transacción registrada con éxito",
            transaccion: {
                id: result.lastID,
                fecha: new Date().toISOString(), // Fecha simulada (la base de datos usa CURRENT_TIMESTAMP default)
                tipo_movimiento,
                monto,
                cuenta_destino,
                usuario_id: usuario_id || null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// GET /api/prestamos -> Lista de usuarios con sus deudas (Préstamos - Pago_Capital)
app.get('/api/prestamos', async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT usuario_id,
                   SUM(CASE WHEN tipo_movimiento = 'Préstamo' THEN monto ELSE 0 END) as total_prestado,
                   SUM(CASE WHEN tipo_movimiento = 'Pago_Capital' THEN monto ELSE 0 END) as total_pagado
            FROM Transacciones
            WHERE usuario_id IS NOT NULL AND usuario_id != ''
            GROUP BY usuario_id
        `);
        
        const prestamos = rows.map(r => ({
            usuario: r.usuario_id,
            deuda_base: r.total_prestado - r.total_pagado
        })).filter(r => r.deuda_base > 0);

        res.json(prestamos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/inversiones -> Lista de usuarios con sus depósitos (Depósito - Retiro)
app.get('/api/inversiones', async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT usuario_id,
                   SUM(CASE WHEN tipo_movimiento = 'Depósito' THEN monto ELSE 0 END) as total_depositado,
                   SUM(CASE WHEN tipo_movimiento = 'Retiro' THEN monto ELSE 0 END) as total_retirado
            FROM Transacciones
            WHERE usuario_id IS NOT NULL AND usuario_id != ''
            GROUP BY usuario_id
        `);
        
        const inversiones = rows.map(r => ({
            usuario: r.usuario_id,
            capital: r.total_depositado - r.total_retirado
        })).filter(r => r.capital > 0);

        res.json(inversiones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/usuarios -> Lista de todos los usuarios registrados
app.get('/api/usuarios', async (req, res) => {
    try {
        const rows = await db.all(`SELECT DISTINCT usuario_id FROM Transacciones WHERE usuario_id IS NOT NULL AND usuario_id != ''`);
        res.json(rows.map(r => r.usuario_id));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;

// Inicializa la BD y levanta el servidor
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`=================================================`);
        console.log(`Endpoints disponibles:`);
        console.log(`  - POST /api/transacciones   [Función 1: Registrar_Transaccion]`);
        console.log(`  - GET  /api/saldos          [Función 2: Calcular_Saldos]`);
    });
}).catch(err => {
    console.error("Error al arrancar la base de datos:", err);
});
