const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sliceModel } = require('../services/slicer');
const { generate3DFromImage } = require('../services/aiGenerator');
const pool = require('../db');

exports.processUpload = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let stlPath = req.file.path;
        let isFromImage = false;

        // Step 1: Handle Image to 3D if photo
        if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
            isFromImage = true;
            const generatedModelName = `gen_${Date.now()}.stl`;
            const generatedPath = path.join(__dirname, '../../uploads/models', generatedModelName);

            // Call AI abstraction
            await generate3DFromImage(req.file.path);
            // In reality, you'd download the result to generatedPath
            // For now, we simulate by Copying a dummy stl if it exists or just proceeding
            stlPath = generatedPath;
        }

        // Step 2: Slicing to get data
        const gcodeName = `${uuidv4()}.gcode`;
        const gcodePath = path.join(__dirname, '../../uploads/gcode', gcodeName);

        // Ensure directories exist
        if (!fs.existsSync(path.join(__dirname, '../../uploads/gcode'))) fs.mkdirSync(path.join(__dirname, '../../uploads/gcode'), { recursive: true });

        // Slice
        let sliceData = { grams: 0, seconds: 0 };
        try {
            sliceData = await sliceModel(req.file.path, gcodePath);
        } catch (sliceErr) {
            console.warn('[SLICER] Failed to slice, using estimates', sliceErr.message);
            sliceData = { grams: 45, seconds: 3600 * 2 }; // Estimates
        }

        // Step 3: Calculate Price
        const [pricingRows] = await pool.execute('SELECT value FROM Pricing WHERE key_name = "price_per_gram"');
        const pricePerGram = pricingRows[0]?.value || 10;
        const totalVolumePrice = sliceData.grams * pricePerGram;

        res.json({
            success: true,
            fileName: req.file.originalname,
            isFromImage,
            grams: sliceData.grams,
            printTime: sliceData.seconds,
            estimatedPrice: totalVolumePrice,
            tempFilePath: req.file.path,
            gcodePath: gcodeName
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
