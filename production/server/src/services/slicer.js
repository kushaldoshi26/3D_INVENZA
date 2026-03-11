const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const SLICER_PATH = process.env.PRUSA_SLICER_PATH;

/**
 * Executes the slicer CLI to generate G-code and extract metadata.
 * @param {string} stlPath - Absolute path to STL file
 * @param {string} outputPath - Absolute path for output G-code
 * @returns {Promise<{grams: number, seconds: number, gcodePath: string}>}
 */
const sliceModel = (stlPath, outputPath) => {
    return new Promise((resolve, reject) => {
        // Basic slicing command for PrusaSlicer
        // Note: In production, you'd have a custom .ini config file for specific printers
        const command = `"${SLICER_PATH}" --export-gcode "${stlPath}" --output "${outputPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[SLICER ERROR] ${stderr}`);
                return reject(error);
            }

            // PrusaSlicer outputs filament usage and print time in the G-code file or stdout
            // Usually, it's at the end of the G-code as comments
            try {
                const gcodeContent = fs.readFileSync(outputPath, 'utf-8');
                const lastLines = gcodeContent.slice(-2000); // Check last 2KB

                // Regex for filament used (mm or g)
                const filamentMatch = lastLines.match(/filament used \[g\] = ([\d.]+)/);
                const timeMatch = lastLines.match(/estimated printing time \(normal mode\) = (.*)/);

                // Parse time (e.g., "1h 22m 30s") to seconds
                let seconds = 3600; // Default 1 hour fallback
                if (timeMatch) {
                    const timeStr = timeMatch[1];
                    const h = timeStr.match(/(\d+)h/);
                    const m = timeStr.match(/(\d+)m/);
                    const s = timeStr.match(/(\d+)s/);
                    seconds = (h ? parseInt(h[1]) * 3600 : 0) +
                        (m ? parseInt(m[1]) * 60 : 0) +
                        (s ? parseInt(s[1]) : 0);
                }

                resolve({
                    grams: filamentMatch ? parseFloat(filamentMatch[1]) : 50, // Fallback 50g
                    seconds: seconds,
                    gcodePath: outputPath
                });
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports = { sliceModel };
