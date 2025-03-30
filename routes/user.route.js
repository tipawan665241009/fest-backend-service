const express = require("express");
const userController = require("../controllers/user.controller");
const route = express.Router();

//? การกำหนดวิธีการเรียกใช้ API (กำหนด end-point)
//? เพิ่ม ใช้post
route.post('/', userController.uploadUser, userController.createUser);
//? ค้นหา ตรวจสอบ ดึ่ง ดู ใช้ get
route.get('/:userName/:userPassword', userController.checkLogin);
//? แก้ไข ใช้ put
route.put('/:userId', userController.uploadUser, userController.updateUser)
module.exports = route;