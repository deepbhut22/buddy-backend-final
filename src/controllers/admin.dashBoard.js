// controllers/dashboardController.js
import Coupon from '../models/coupon.model.js';
import Discount from '../models/discount.model.js';
import Redemption from '../models/redemption.model.js';
import User from '../models/user.model.js';
import UserRequest from '../models/userRequest.model.js';

// Helper function to get date range for filtering
const getDateRange = (period) => {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(now.getMonth() - 1); // Default to last month
    }

    return { startDate, endDate };
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Group data by date and count occurrences
const groupByDate = (data, dateField) => {
    const grouped = {};

    data.forEach(item => {
        const date = formatDate(new Date(item[dateField]));
        if (!grouped[date]) {
            grouped[date] = 0;
        }
        grouped[date]++;
    });

    return grouped;
};

// Get dashboard data
export const getDashboardData = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        // Get counts
        const [
            totalCoupons,
            totalDiscounts,
            totalUsers,
            activeUsers,
            pendingRequests,
            totalRedemptions,
        ] = await Promise.all([
            Coupon.countDocuments(),
            Discount.countDocuments(),
            User.countDocuments(),
            User.countDocuments({ status: 'active' }),
            UserRequest.countDocuments({ status: 'pending' }),
            Redemption.countDocuments(),
        ]);

        // Recent redemptions
        const recentRedemptions = await Redemption.find()
            .sort({ redeemedAt: -1 })
            .limit(10);

        // Redemptions over time
        const redemptionsInPeriod = await Redemption.find({
            redeemedAt: { $gte: startDate, $lte: endDate }
        });

        const redemptionsOverTime = groupByDate(redemptionsInPeriod, 'redeemedAt');

        // Redemptions by category
        const redemptionsByCategory = await Redemption.aggregate([
            { $unwind: "$category" },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Redemptions by company
        const redemptionsByCompany = await Redemption.aggregate([
            { $group: { _id: "$company", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Redemptions by type (coupon vs discount)
        const redemptionsByType = await Redemption.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        // User registrations over time
        const userRegistrations = await User.find({
            approvalDate: { $gte: startDate, $lte: endDate }
        });

        const userRegistrationsOverTime = groupByDate(userRegistrations, 'approvalDate');

        // Users by category
        const usersByCategory = await User.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Users by service
        const usersByService = await User.aggregate([
            { $group: { _id: "$service", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Redemption status distribution
        const redemptionStatusDistribution = await Redemption.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Monthly redemption trends (last 12 months)
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        const monthlyRedemptions = await Redemption.aggregate([
            {
                $match: {
                    redeemedAt: { $gte: lastYear }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$redeemedAt" },
                        month: { $month: "$redeemedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format monthly data for easier consumption
        const monthlyRedemptionData = monthlyRedemptions.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            count: item.count
        }));

        // Get expiring soon coupons (expiring in next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const expiringSoonCoupons = await Coupon.find({
            endDate: { $gte: new Date(), $lte: nextWeek }
        }).limit(10);

        // Average discount percentage
        const averageDiscountPercentage = await Redemption.aggregate([
            { $group: { _id: null, avg: { $avg: "$discountPercentage" } } }
        ]);

        // Calculate total available coupons and discounts
        const availableCoupons = await Coupon.aggregate([
            { $group: { _id: null, total: { $sum: "$remainingCoupons" } } }
        ]);

        const availableDiscounts = await Discount.aggregate([
            { $group: { _id: null, total: { $sum: "$remainingCoupons" } } }
        ]);

        // Response object
        const dashboardData = {
            summary: {
                totalCoupons,
                totalDiscounts,
                totalUsers,
                activeUsers,
                pendingRequests,
                totalRedemptions,
                availableCoupons: availableCoupons[0]?.total || 0,
                availableDiscounts: availableDiscounts[0]?.total || 0,
                averageDiscount: averageDiscountPercentage[0]?.avg || 0
            },
            charts: {
                redemptionsOverTime,
                redemptionsByCategory: redemptionsByCategory.map(item => ({
                    category: item._id,
                    count: item.count
                })),
                redemptionsByCompany: redemptionsByCompany.map(item => ({
                    company: item._id,
                    count: item.count
                })),
                redemptionsByType: redemptionsByType.map(item => ({
                    type: item._id,
                    count: item.count
                })),
                userRegistrationsOverTime,
                usersByCategory: usersByCategory.map(item => ({
                    category: item._id,
                    count: item.count
                })),
                usersByService: usersByService.map(item => ({
                    service: item._id,
                    count: item.count
                })),
                redemptionStatusDistribution: redemptionStatusDistribution.map(item => ({
                    status: item._id,
                    count: item.count
                })),
                monthlyRedemptionData
            },
            recentData: {
                recentRedemptions,
                expiringSoonCoupons
            }
        };

        // console.log(dashboardData);

        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

// Get detailed redemption analytics
export const getRedemptionAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const startDateObj = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3));
        const endDateObj = endDate ? new Date(endDate) : new Date();

        // Optional filters
        const filters = {};
        if (req.query.category) filters.category = { $in: [req.query.category] };
        if (req.query.company) filters.company = req.query.company;
        if (req.query.type) filters.type = req.query.type;

        // Main date filter
        filters.redeemedAt = { $gte: startDateObj, $lte: endDateObj };

        // Redemptions over time (daily)
        const dailyRedemptions = await Redemption.aggregate([
            { $match: filters },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$redeemedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Conversion into chart-friendly format
        const timeSeriesData = dailyRedemptions.map(item => ({
            date: item._id,
            redemptions: item.count
        }));

        // Get conversion rates (if applicable based on your business logic)
        // This is a placeholder - you would need to define how conversions are tracked
        const totalViews = 1000; // This would come from your tracking system
        const conversionRate = (timeSeriesData.reduce((sum, item) => sum + item.redemptions, 0) / totalViews) * 100;

        res.status(200).json({
            success: true,
            data: {
                timeSeriesData,
                conversionRate: parseFloat(conversionRate.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Redemption analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

// Get detailed user analytics
export const getUserAnalytics = async (req, res) => {
    try {
        // User growth over time
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$approvalDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Most active users (by redemptions)
        const activeUsers = await Redemption.aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    userEmail: { $arrayElemAt: ["$userDetails.email", 0] },
                    userName: {
                        $concat: [
                            { $arrayElemAt: ["$userDetails.firstName", 0] },
                            " ",
                            { $arrayElemAt: ["$userDetails.lastName", 0] }
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                userGrowth: userGrowth.map(item => ({
                    month: item._id,
                    newUsers: item.count
                })),
                activeUsers
            }
        });
    } catch (error) {
        console.error('User analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

// Get summary reports
export const getSummaryReports = async (req, res) => {
    try {
        // Overall coupon and discount statistics
        const couponStats = await Coupon.aggregate([
            {
                $group: {
                    _id: null,
                    totalCoupons: { $sum: "$totalCoupons" },
                    remainingCoupons: { $sum: "$remainingCoupons" },
                    redemptionRate: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$totalCoupons", "$remainingCoupons"] },
                                "$totalCoupons"
                            ]
                        }
                    }
                }
            }
        ]);

        const discountStats = await Discount.aggregate([
            {
                $group: {
                    _id: null,
                    totalDiscounts: { $sum: "$totalCoupons" },
                    remainingDiscounts: { $sum: "$remainingCoupons" },
                    redemptionRate: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$totalCoupons", "$remainingCoupons"] },
                                "$totalCoupons"
                            ]
                        }
                    }
                }
            }
        ]);

        // Get count by status
        const userStatusCount = await User.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Get pending requests count
        const pendingRequestsCount = await UserRequest.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                couponStats: couponStats[0] || { totalCoupons: 0, remainingCoupons: 0, redemptionRate: 0 },
                discountStats: discountStats[0] || { totalDiscounts: 0, remainingDiscounts: 0, redemptionRate: 0 },
                userStatusCount: userStatusCount.map(item => ({
                    status: item._id,
                    count: item.count
                })),
                pendingRequestsCount
            }
        });
    } catch (error) {
        console.error('Summary reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

export default {
    getDashboardData,
    getRedemptionAnalytics,
    getUserAnalytics,
    getSummaryReports
};