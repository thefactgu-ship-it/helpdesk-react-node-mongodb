const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const hotelController = require("../controllers/hotelController");
const {
  createHotelValidationRules,
  handleValidationErrors,
  updateHotelValidationRules,
} = require("../validators/hotelValidator");

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(hotelController.getHotels));
router.post(
  "/",
  authMiddleware,
  createHotelValidationRules(),
  handleValidationErrors,
  asyncHandler(hotelController.createHotel)
);
router.patch(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  updateHotelValidationRules(),
  handleValidationErrors,
  asyncHandler(hotelController.updateHotel)
);
router.delete(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(hotelController.deleteHotel)
);

module.exports = router;
