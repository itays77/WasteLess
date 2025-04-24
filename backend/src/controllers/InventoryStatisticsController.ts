import { Request, Response } from 'express';
import Ingredient, { IngredientCategory } from '../models/ingredient';
import { startOfMonth, subMonths, format } from 'date-fns';

// Get detailed inventory statistics
const getInventoryStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { timeRange = 'alltime' } = req.query;

    // Calculate the start date based on the time range
    let startDate = new Date(0); // Default to epoch start for "all time"

    if (timeRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo;
    } else if (timeRange === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      startDate = threeMonthsAgo;
    } else if (timeRange === '6months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      startDate = sixMonthsAgo;
    } else if (timeRange === '1year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      startDate = oneYearAgo;
    }

    // Base filter for all queries
    const baseFilter = {
      userId,
      createdAt: { $gte: startDate },
    };

    // Calculate category statistics
    const categoryStats = await Ingredient.aggregate([
      { $match: baseFilter },
      {
        $facet: {
          // Group by category for overall counts
          categoryCount: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                // Count expired items (proxy for wasted)
                wastedCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$expiryDate', null] },
                          { $lt: ['$expiryDate', new Date()] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Process category stats to calculate used items
    const categories = categoryStats[0].categoryCount.map((cat: any) => ({
      _id: cat._id,
      count: cat.count,
      wastedCount: cat.wastedCount,
      usedCount: cat.count - cat.wastedCount,
    }));

    // Get most wasted ingredients (that have expired)
    const mostWastedIngredients = await Ingredient.aggregate([
      {
        $match: {
          ...baseFilter,
          expiryDate: { $ne: null, $lt: new Date() },
        },
      },
      {
        $group: {
          _id: { name: '$name', category: '$category' },
          wastedCount: { $sum: 1 },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          category: '$_id.category',
          wastedCount: 1,
          wastePercentage: {
            $multiply: [{ $divide: ['$wastedCount', '$totalCount'] }, 100],
          },
        },
      },
      { $sort: { wastedCount: -1 } },
      { $limit: 5 },
    ]);

    // Get most used ingredients (not expired)
    const mostUsedIngredients = await Ingredient.aggregate([
      {
        $match: {
          ...baseFilter,
          $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }],
        },
      },
      {
        $group: {
          _id: { name: '$name', category: '$category' },
          usedCount: { $sum: 1 },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          category: '$_id.category',
          usedCount: 1,
          usagePercentage: {
            $multiply: [{ $divide: ['$usedCount', '$totalCount'] }, 100],
          },
        },
      },
      { $sort: { usedCount: -1 } },
      { $limit: 5 },
    ]);

    // Calculate monthly trends for the last 6 months
    const monthlyTrends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const nextMonthStart = startOfMonth(subMonths(now, i - 1));

      const monthlyStats = await Ingredient.aggregate([
        {
          $match: {
            userId,
            createdAt: {
              $gte: monthStart,
              $lt: nextMonthStart,
            },
          },
        },
        {
          $facet: {
            total: [{ $count: 'count' }],
            wasted: [
              {
                $match: {
                  expiryDate: { $ne: null, $lt: new Date() },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]);

      const totalCount = monthlyStats[0].total[0]?.count || 0;
      const wastedCount = monthlyStats[0].wasted[0]?.count || 0;
      const wastePercentage =
        totalCount > 0 ? (wastedCount / totalCount) * 100 : 0;

      monthlyTrends.push({
        month: format(monthStart, 'MMM'),
        year: monthStart.getFullYear(),
        totalItems: totalCount,
        wastedItems: wastedCount,
        wastePercentage: Math.round(wastePercentage),
      });
    }

    // Calculate summary statistics
    // Total items
    const totalItems = await Ingredient.countDocuments(baseFilter);

    // Wasted items (expired)
    const wastedItems = await Ingredient.countDocuments({
      ...baseFilter,
      expiryDate: { $ne: null, $lt: new Date() },
    });

    // Calculate waste percentage
    const wastePercentage =
      totalItems > 0 ? Math.round((wastedItems / totalItems) * 100) : 0;

    // Find most wasted category
    let mostWastedCategory = 'None';
    let highestWasteCount = 0;

    categories.forEach((cat: any) => {
      if (cat.wastedCount > highestWasteCount) {
        highestWasteCount = cat.wastedCount;
        mostWastedCategory = cat._id;
      }
    });

    // Find most used category
    let mostUsedCategory = 'None';
    let highestUsedCount = 0;

    categories.forEach((cat: any) => {
      if (cat.usedCount > highestUsedCount) {
        highestUsedCount = cat.usedCount;
        mostUsedCategory = cat._id;
      }
    });

    // Calculate improvement from last month
    const currentMonthWaste =
      monthlyTrends[monthlyTrends.length - 1]?.wastePercentage || 0;
    const lastMonthWaste =
      monthlyTrends[monthlyTrends.length - 2]?.wastePercentage || 0;
    const improvementFromLastMonth = Math.max(
      0,
      lastMonthWaste - currentMonthWaste
    );

    // Build summary stats
    const summaryStats = {
      totalItems,
      wastedItems,
      wastePercentage,
      mostWastedCategory,
      mostUsedCategory,
      improvementFromLastMonth,
    };

    // Return the compiled statistics
    res.status(200).json({
      categoryStats: categories,
      mostWastedIngredients,
      mostUsedIngredients,
      monthlyTrends,
      summaryStats,
    });
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({ message: 'Error fetching inventory statistics' });
  }
};

export default {
  getInventoryStatistics,
};
