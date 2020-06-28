const express = require("express");
const { userprofileController } = require('./../controllers')
const {auth}=require('../helper/jwtauth')


const router = express.Router();

router.get('/getuser', auth, userprofileController.getUser);
router.get('/getregion', userprofileController.getRegion);
router.put('/updateuser/:id', userprofileController.updateUser);
router.get('/changepassword', auth, userprofileController.changePassword);
router.put('/uploadimage', auth, userprofileController.editimage);
// router.post('/resetpass', userController.changePass);


module.exports = router;