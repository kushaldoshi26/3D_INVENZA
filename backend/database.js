import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
let db = {
  users: [],
  orders: [],
  products: [],
  pricingConfig: {
    materialRate: 18, // ₹18 per gram
    timeRate: 50, // ₹50 per hour
    labourProfit: 150, // ₹150 flat
    density: 1.24, // PLA density g/cm³
    speedCm3PerHour: 12 // print speed cm³/hour
  }
};

// Load database from file
export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('✅ Database loaded from file');
    } else {
      saveDatabase();
      console.log('✅ New database created');
    }
  } catch (error) {
    console.error('❌ Error loading database:', error.message);
  }
  return db;
}

// Save database to file
export function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('❌ Error saving database:', error.message);
  }
}

// Auto-save every 30 seconds
setInterval(saveDatabase, 30000);

// Save on exit
process.on('SIGINT', () => {
  saveDatabase();
  console.log('\n✅ Database saved. Goodbye!');
  process.exit(0);
});

export default db;
