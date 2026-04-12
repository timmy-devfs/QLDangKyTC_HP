const express = require("express");
const router = express.Router();
const diemController = require("../controllers/diemController");

router.get("/", diemController.getDiem);
router.put("/", diemController.nhapDiem);

module.exports = router;