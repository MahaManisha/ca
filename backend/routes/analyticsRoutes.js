// routes/analyticsRoutes.js
import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/Protect.js';

const router = express.Router();

// @route   GET /api/admin/analytics
// @desc    Get analytics data for admin dashboard
// @access  Admin only
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Total Items
    let totalItems = 0;
    let itemCategories = [];
    
    try {
      const Item = (await import('../models/Item.js')).default;
      totalItems = await Item.countDocuments();
      
      // Get items grouped by category
      const categoryCounts = await Item.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Define colors for categories
      const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
      
      itemCategories = categoryCounts.map((cat, index) => ({
        name: cat._id || 'Uncategorized',
        value: cat.count,
        color: colors[index % colors.length]
      }));
    } catch (err) {
      console.log('⚠️  Item model not found or error:', err.message);
      // Set default empty category if no items
      itemCategories = [{ name: 'No Items', value: 0, color: '#e5e7eb' }];
    }

    // 3. Sales Distribution
    let totalSales = 0;
    let onlineSales = 0;
    let offlineSales = 0;

    try {
      const Purchase = (await import('../models/Purchase.js')).default;
      
      // Count online sales
      onlineSales = await Purchase.countDocuments({ 
        paymentMode: 'online' 
      });
      
      // Count offline sales
      offlineSales = await Purchase.countDocuments({ 
        paymentMode: 'offline' 
      });
      
      totalSales = onlineSales + offlineSales;
    } catch (err) {
      console.log('⚠️  Purchase model not found or error:', err.message);
    }

    // 4. User breakdown (by role)
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const userBreakdown = usersByRole.map(role => ({
      name: role._id,
      value: role.count
    }));

    // Send response
    res.json({
      totalUsers,
      totalItems,
      totalSales,
      onlineSales,
      offlineSales,
      itemCategories,
      userBreakdown
    });

  } catch (error) {
    console.error('❌ Analytics Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics data',
      error: error.message 
    });
  }
});

export default router;