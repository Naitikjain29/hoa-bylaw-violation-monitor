const mongoose = require("mongoose");
const Property = require("../models/Property");
const User = require("../models/User");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const createProperty = async (req, res, next) => {
  try {
    const {
      propertyName,
      propertyNumber,
      address,
      owner,
      assignedInspector,
      propertyType,
      description,
      images
    } = req.body;

    if (!isValidId(owner)) {
      return res.status(400).json({
        success: false,
        message: "A valid homeowner ID is required."
      });
    }

    const homeowner = await User.findOne({
      _id: owner,
      role: "homeowner",
      isActive: true
    });

    if (!homeowner) {
      return res.status(404).json({
        success: false,
        message: "Valid active homeowner not found."
      });
    }

    if (assignedInspector) {
      if (!isValidId(assignedInspector)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inspector ID."
        });
      }

      const inspector = await User.findOne({
        _id: assignedInspector,
        role: "inspector",
        isActive: true
      });

      if (!inspector) {
        return res.status(404).json({
          success: false,
          message: "Valid active inspector not found."
        });
      }
    }

    const property = await Property.create({
      propertyName,
      propertyNumber,
      address,
      owner,
      assignedInspector: assignedInspector || null,
      propertyType,
      description,
      images: Array.isArray(images) ? images : []
    });

    await property.populate([
      { path: "owner", select: "fullName email phone role" },
      { path: "assignedInspector", select: "fullName email phone role" }
    ]);

    return res.status(201).json({
      success: true,
      message: "Property created successfully.",
      property
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Property number already exists."
      });
    }
    next(error);
  }
};

const getAllProperties = async (req, res, next) => {
  try {
    const filter = { status: "active" };

    if (req.user.role === "homeowner") {
      filter.owner = req.user._id;
    } else if (req.user.role === "inspector") {
      filter.assignedInspector = req.user._id;
    } else if (!["admin", "board_member"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view properties."
      });
    }

    const properties = await Property.find(filter)
      .populate("owner", "fullName email phone")
      .populate("assignedInspector", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "fullName email phone")
      .populate("assignedInspector", "fullName email phone");

    if (!property || property.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Property not found."
      });
    }

    if (
      req.user.role === "homeowner" &&
      String(property.owner._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this property."
      });
    }

    if (
      req.user.role === "inspector" &&
      (!property.assignedInspector ||
        String(property.assignedInspector._id) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: "This property is not assigned to you."
      });
    }

    if (!["admin", "board_member", "homeowner", "inspector"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this property."
      });
    }

    return res.status(200).json({ success: true, property });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const allowedFields = [
      "propertyName",
      "propertyNumber",
      "address",
      "propertyType",
      "description",
      "images"
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, status: "active" },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("owner", "fullName email phone")
      .populate("assignedInspector", "fullName email phone");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property updated successfully.",
      property
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Property number already exists."
      });
    }
    next(error);
  }
};

const assignProperty = async (req, res, next) => {
  try {
    const { owner, assignedInspector } = req.body;
    const updates = {};

    if (owner !== undefined) {
      if (!isValidId(owner)) {
        return res.status(400).json({
          success: false,
          message: "A valid homeowner ID is required."
        });
      }

      const homeowner = await User.findOne({
        _id: owner,
        role: "homeowner",
        isActive: true
      });

      if (!homeowner) {
        return res.status(404).json({
          success: false,
          message: "Valid active homeowner not found."
        });
      }
      updates.owner = owner;
    }

    if (assignedInspector !== undefined) {
      if (assignedInspector === null || assignedInspector === "") {
        updates.assignedInspector = null;
      } else {
        if (!isValidId(assignedInspector)) {
          return res.status(400).json({
            success: false,
            message: "Invalid inspector ID."
          });
        }

        const inspector = await User.findOne({
          _id: assignedInspector,
          role: "inspector",
          isActive: true
        });

        if (!inspector) {
          return res.status(404).json({
            success: false,
            message: "Valid active inspector not found."
          });
        }
        updates.assignedInspector = assignedInspector;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide owner or assignedInspector to update."
      });
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, status: "active" },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("owner", "fullName email phone")
      .populate("assignedInspector", "fullName email phone");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property assignment updated successfully.",
      property
    });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, status: "active" },
      { $set: { status: "inactive" } },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property deactivated successfully."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  assignProperty,
  deleteProperty
};
