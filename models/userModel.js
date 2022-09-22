const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
	
	name : {
		type:String,
		required : [true,'please provide your name']
	},

	email : {
		type:String,
		required:[true,'please provide your email'],
		unique:true,
		lowercase :true,
		validate : [validator.isEmail,'please provide a valid email idd']},
	
	photo : {
		type:String,
		default: 'default.jpg'
	},
	
	password : {
		type:String,
		required:[true,'please provide a password'],
		minlength : [8,'password should be atleast 8 characters'],
		select:false
	},
	role : {
		type : String,
		enum : {
			values : ['user','admin','guide','lead-guide']
		},
		default : 'user'
	},

	passwordconfirm : {
		type:String,
		required:[true,'please confirm your password'],
		validate : {
			validator : function(pass){
				return this.password === pass;
			}
		}
	},

	passwordChangedAt : Date,
	passwordResettoken : String,
	passwordExpiresIn : Date,
	active :{
		type : String,
		default : true
	}
})

userSchema.pre('save', async function(next){
	if(!this.isModified('password')) return next();
	else {
		this.password = await bcrypt.hash(this.password,12);
		this.passwordconfirm = undefined;
		next()

	}
})

userSchema.pre(/^find/,function(next){
	this.find({active:{$ne:false}});
	next();
})

userSchema.pre('save',function(next){
	if(!this.isModified('password') || this.isNew) return next();
 //this.isNew is for when we are creating a new document so that it doesn't come as password being modified
 	this.passwordChangedAt = Date.now() - 1000;
 	next();
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
	return await bcrypt.compare(candidatePassword,userPassword) //here since we mentioned select field for password as false,we can't access this.pasword..hence we passed the value as userpassword
}

userSchema.methods.changedPasswordAfter = function(jwt){
	if(this.passwordChangedAt)
		{
			const changedtime =  parseInt(this.passwordChangedAt.getTime() / 1000,10);
			return jwt < changedtime
		}
	return false;

}

userSchema.methods.resetToken = function(){
	const resetToken = crypto.randomBytes(32).toString("hex");
	this.passwordResettoken = crypto.createHash('sha256').update(resetToken).digest("hex");
	this.passwordExpiresIn = Date.now() + 10*60*1000;

	return resetToken;

}
const User = mongoose.model('User',userSchema);

module.exports = User;