import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import myUserRoute from './routes/MyUserRoute';
import inventoryRoute from './routes/InventoryRoute';
import purchaseRoute from './routes/PurchaseRoute';
import path from 'path';

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit for receipt images
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/my/user', myUserRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/purchases', purchaseRoute);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8700;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
