
const User = require("../models/User");
const Property = require("../models/Property");
const Violation = require("../models/Violation");
const Inspection = require("../models/Inspection");
const Notice = require("../models/Notice");

// GET: Dashboard Statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let dashboard = {};

    // ADMIN DASHBOARD
    if (role === "admin") {
      const [
        totalUsers,
        totalProperties,
        totalViolations,
        pendingViolations,
        confirmedViolations,
        resolvedViolations,
        totalInspections,
        pendingInspections,
        completedInspections,
        totalNotices,
        issuedNotices
      ] = await Promise.all([
        User.countDocuments(),
        Property.countDocuments(),
        Violation.countDocuments(),
        Violation.countDocuments({ status: "pending" }),
        Violation.countDocuments({ status: "confirmed" }),
        Violation.countDocuments({ status: "resolved" }),
        Inspection.countDocuments(),
        Inspection.countDocuments({
          status: { $in: ["scheduled", "in_progress"] }
        }),
        Inspection.countDocuments({ status: "completed" }),
        Notice.countDocuments(),
        Notice.countDocuments({ status: "issued" })
      ]);

      dashboard = {
        role,
        users: { total: totalUsers },
        properties: { total: totalProperties },
        violations: {
          total: totalViolations,
          pending: pendingViolations,
          confirmed: confirmedViolations,
          resolved: resolvedViolations
        },
        inspections: {
          total: totalInspections,
          pending: pendingInspections,
          completed: completedInspections
        },
        notices: {
          total: totalNotices,
          issued: issuedNotices
        }
      };
    }

    // BOARD MEMBER DASHBOARD
    else if (role === "board_member") {
      const [
        totalProperties,
        totalViolations,
        pendingViolations,
        confirmedViolations,
        resolvedViolations,
        totalInspections,
        completedInspections,
        totalNotices,
        issuedNotices
      ] = await Promise.all([
        Property.countDocuments(),
        Violation.countDocuments(),
        Violation.countDocuments({ status: "pending" }),
        Violation.countDocuments({ status: "confirmed" }),
        Violation.countDocuments({ status: "resolved" }),
        Inspection.countDocuments(),
        Inspection.countDocuments({ status: "completed" }),
        Notice.countDocuments(),
        Notice.countDocuments({ status: "issued" })
      ]);

      dashboard = {
        role,
        properties: { total: totalProperties },
        violations: {
          total: totalViolations,
          pending: pendingViolations,
          confirmed: confirmedViolations,
          resolved: resolvedViolations
        },
        inspections: {
          total: totalInspections,
          completed: completedInspections
        },
        notices: {
          total: totalNotices,
          issued: issuedNotices
        }
      };
    }

    // INSPECTOR DASHBOARD
    else if (role === "inspector") {
      const [
        assignedInspections,
        scheduledInspections,
        inProgressInspections,
        completedInspections,
        cancelledInspections,
        reportedViolations
      ] = await Promise.all([
        Inspection.countDocuments({ inspector: userId }),
        Inspection.countDocuments({
          inspector: userId,
          status: "scheduled"
        }),
        Inspection.countDocuments({
          inspector: userId,
          status: "in_progress"
        }),
        Inspection.countDocuments({
          inspector: userId,
          status: "completed"
        }),
        Inspection.countDocuments({
          inspector: userId,
          status: "cancelled"
        }),
        Violation.countDocuments({ reportedBy: userId })
      ]);

      dashboard = {
        role,
        inspections: {
          assigned: assignedInspections,
          scheduled: scheduledInspections,
          inProgress: inProgressInspections,
          completed: completedInspections,
          cancelled: cancelledInspections
        },
        violations: {
          reported: reportedViolations
        }
      };
    }

    // HOMEOWNER DASHBOARD
    else if (role === "homeowner") {
      const properties = await Property.find({ owner: userId })
        .select("_id propertyName propertyNumber address status")
        .lean();

      const propertyIds = properties.map((property) => property._id);

      const [
        totalViolations,
        pendingViolations,
        confirmedViolations,
        resolvedViolations,
        totalNotices,
        issuedNotices,
        totalInspections,
        completedInspections
      ] = await Promise.all([
        Violation.countDocuments({ property: { $in: propertyIds } }),
        Violation.countDocuments({
          property: { $in: propertyIds },
          status: "pending"
        }),
        Violation.countDocuments({
          property: { $in: propertyIds },
          status: "confirmed"
        }),
        Violation.countDocuments({
          property: { $in: propertyIds },
          status: "resolved"
        }),
        Notice.countDocuments({ homeowner: userId }),
        Notice.countDocuments({
          homeowner: userId,
          status: "issued"
        }),
        Inspection.countDocuments({ property: { $in: propertyIds } }),
        Inspection.countDocuments({
          property: { $in: propertyIds },
          status: "completed"
        })
      ]);

      dashboard = {
        role,
        properties: {
          total: properties.length,
          list: properties
        },
        violations: {
          total: totalViolations,
          pending: pendingViolations,
          confirmed: confirmedViolations,
          resolved: resolvedViolations
        },
        notices: {
          total: totalNotices,
          issued: issuedNotices
        },
        inspections: {
          total: totalInspections,
          completed: completedInspections
        }
      };
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Dashboard access denied for this role"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
