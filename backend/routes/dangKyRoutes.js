const express = require("express");
const router = express.Router();
const dangKyController = require("../controllers/dangKyController");

router.post("/", dangKyController.dangKyHocPhan);

module.exports = router;

// task 4.2 DELETE (huy dang ki + trigger )

router.delete("/", dangKyController.huyDangKy);