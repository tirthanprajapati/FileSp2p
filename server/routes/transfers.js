import express from 'express';
import Transfer from '../models/Transfer.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create new transfer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverEmail, fileName, fileType, fileSize, transferId } = req.body;
    
    const transfer = new Transfer({
      senderId: req.user.id,
      receiverEmail,
      fileName,
      fileType,
      fileSize,
      transferId
    });
    
    await transfer.save();
    
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's transfers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transfers = await Transfer.find({
      $or: [
        { senderId: req.user.id },
        { receiverEmail: req.user.email }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transfer status
router.patch('/:transferId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const transfer = await Transfer.findOne({ transferId: req.params.transferId });
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    transfer.status = status;
    if (status === 'completed') {
      transfer.completedAt = new Date();
    }
    
    await transfer.save();
    
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transfer by ID
router.get('/:transferId', async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ transferId: req.params.transferId });
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;