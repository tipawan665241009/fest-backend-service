//? จัดการ DB
const { PrismaClient } = require("@prisma/client");

//? จัดการการ Upload
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//? สร้างตัวแปรอ้างอิงสำหรับ prisma เพื่อเอาไปงาน
const prisma = new PrismaClient();

//? การอัปโหลดไฟล์----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/users");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "user_" +
      Math.floor(Math.random() * Date.now()) +
      path.extname(file.originalname)
    );
  },
});

exports.uploadUser = multer({
  storage: storage,
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname));
    if (mimeType && extname) {
      return cb(null, true);
    }
    cb("Error: Images Only");
  },
}).single("userImage");
//-------------------------------------------

//? ฟังก์ชันการทำงานต่างของ API ที่สร้างขึ้นมา----------------------------------
//? เพิ่ม USER (Create/Insert) ลงตารางใน DB-----------
exports.createUser = async (req, res) => {
  try {
    //? -----
    const result = await prisma.user_tb.create({
      //?  .create ใช้สำหรับเพิ่ม (insert) ข้อมูล
      data: {
        userFullname: req.body.userFullname,
        userName: req.body.userName,
        userPassword: req.body.userPassword,
        userImage: req.file
          ? req.file.path.replace("images\\users\\", "")
          : "",
      },
    });
    //? -----
    res.status(201).json({
      message: "OK",
      info: result,
    });
  } catch (error) {
    res.status(500).json({
      message: `พบปัญหาในการทำงาน: ${error}`,
    });
    console.log(`Error: ${error}`);
  }
};

//? ตรวจสอบ USER (Read/Select) จากชื่อผู้ใช้ และรหัสผ่าน กับตารางใน DB---------
exports.checkLogin = async (req, res) => {
  try {
    //? ----
    const result = await prisma.user_tb.findFirst({
      where: {
        userName: req.params.userName,
        userPassword: req.params.userPassword,
      },
    });
    //? -----
    if (result) {
      res.status(200).json({
        message: "Ok",
        info: result,
      });
    } else {
      res.status(404).json({
        message: "OK",
        info: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `พบปัญหาในการทำงาน: ${error}`,
    });
    console.log(`Error: ${error}`);
  }
};

//? แก้ไข USER (Update) ข้อมูลตารางใน DB---------
exports.updateUser = async (req, res) => {
  try {
    let result = {};
    //? ----
    //? ด้วยความที่มีการเก็บรูป เลยต้องมีการตรวจสอบก่อนว่า ข้อมูลนั้นมีรูปหรือไม่ ถ้าไม่มีรูปก็ไม่มีอะไร
    //? แต่ถ้ามีรูป แล้วมีการอัปเดจรูป รูปที่มีอยู่เดิมจะถูกลบทิ้ง
    //? ตรวจสอบว่าการแก้ไขนี้มีการอัปโหลดรูปมาเพื่อแก้ไขหรือไม่
    if (req.file) {
      //? แก้ไขข้อมูลแบบแก้ไขรูปด้วย ต้องลบรูปเก่าออกก่อน
      //? ดึงข้อมูลของ user คนที่จะแก้ไข
      const userResult = await prisma.user_tb.findFirst({
        where: {
          userId: parseInt(req.params.userId),
        },
      });
      //? เอาข้อมูลของ user ที่ได้มามาดูว่ามีรูปไหม ถ้ามีให้ลบรูปนั้นทิ้ง
      if (userResult.userImage) {
        fs.unlinkSync(path.join("images/users", userResult.userImage)); //ลบรูปทิ้ง
      }
      //? แก้ไขข้อมูลในฐานข้อมูล
      result = await prisma.user_tb.update({
        where: {
          userId: parseInt(req.params.userId),
        },
        data: {
          userFullname: req.body.userFullname,
          userName: req.body.userName,
          userPassword: req.body.userPassword,
          userImage: req.file.path.replace("images\\users\\", ""),
        },
      });
    } else {
      //? แก้ไขข้อมูลแบบไม่มีการแก้ไขรูป
      result = await prisma.user_tb.update({
        where: {
          userId: parseInt(req.params.userId),
        },
        data: {
          userFullname: req.body.userFullname,
          userName: req.body.userName,
          userPassword: req.body.userPassword,
        },
      });
    }
    //? -----
    res.status(200).json({
      message: "Ok",
      info: result,
    });
  } catch (error) {
    res.status(500).json({
      message: `พบปัญหาในการทำงาน: ${error}`,
    });
    console.log(`Error: ${error}`);
  }
};

//? --------------------------------------------------------------------