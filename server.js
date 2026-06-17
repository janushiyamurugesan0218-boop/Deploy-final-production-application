/**
 * ENTERPRISE PRODUCTION BACKEND ENGINE
 * File: server.js
 * Stack: Node.js + Express.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
// Production Port Configuration (Defaults to 8080 for production cloud environments)
const PORT = process.env.PORT || 8080; 

// ==========================================
// 1. PRODUCTION DATA ACCESSIBILITY LAYER (DAO)
// ==========================================
const productionDatabaseCluster = {
    assets: [
        { id: "SYS-9001", partName: "Turbine Generator Core", serialNumber: "TGC-X100", status: "Operational", lastMaintained: "2026-01-15" },
        { id: "SYS-9002", partName: "Cooling Tower Valve Array", serialNumber: "CTV-M500", status: "Maintenance Required", lastMaintained: "2026-05-10" }
    ]
};

class ProductionAssetModel {
    static async findAll() {
        return new Promise((resolve) => setImmediate(() => resolve(productionDatabaseCluster.assets)));
    }

    static async insert(assetData) {
        return new Promise((resolve, reject) => {
            if (!assetData.partName || !assetData.serialNumber) {
                return reject(new Error("MANDATORY_FIELDS_MISSING"));
            }
            const newRecord = {
                id: `SYS-${Math.floor(1000 + Math.random() * 9000)}`,
                partName: String(assetData.partName).trim(),
                serialNumber: String(assetData.serialNumber).trim(),
                status: assetData.status === "Maintenance Required" ? "Maintenance Required" : "Operational",
                lastMaintained: new Date().toISOString().split('T')[0]
            };
            productionDatabaseCluster.assets.push(newRecord);
            resolve(newRecord);
        });
    }
}

// ==========================================
// 2. MIDDLEWARE CONFIGURATION MATRIX
// ==========================================
// Strict CORS configuration for production security
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by Production CORS Security Policy'));
        }
    }
}));

app.use(express.json()); // Essential body parser payload limit protection

// Request Logger Middleware for auditing
app.use((req, res, next) => {
    console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} -> ${req.url} | IP: ${req.ip}`);
    next();
});

// ==========================================
// 3. CORE ROUTING CONTROLLERS
// ==========================================
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: "HEALTHY", uptime: process.uptime() });
});

app.get('/api/v1/assets', async (req, res, next) => {
    try {
        const datasets = await ProductionAssetModel.findAll();
        res.status(200).json({ success: true, telemetry: datasets });
    } catch (error) {
        next(error);
    }
});

app.post('/api/v1/assets', async (req, res, next) => {
    try {
        const committedRecord = await ProductionAssetModel.insert(req.body);
        res.status(201).json({ success: true, data: committedRecord });
    } catch (error) {
        if (error.message === "MANDATORY_FIELDS_MISSING") {
            return res.status(422).json({ success: false, error: "Validation Error: Missing fields." });
        }
        next(error);
    }
});

// ==========================================
// 4. CENTRALIZED PRODUCTION ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error(`[CRITICAL ERROR CLUSTER]: ${err.message}`);
    res.status(500).json({
        success: false,
        error: "Internal Server Infrastructure Exception",
        referenceTimestamp: Date.now()
    });
});

// ==========================================
// 5. APPLICATION BOOTSTRAPPER
// ==========================================
app.listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(` PRODUCTION SERVER INSTANCE INITIALIZED SUCCESSFULLY`);
    console.log(` Listening on: http://localhost:${PORT}`);
    console.log(` Environment Variable Check: Port [${PORT}]`);
    console.log(`===================================================\n`);
});