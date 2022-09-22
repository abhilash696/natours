const mongoose = require('mongoose');
const Tour  = require('./Tourmodel')

const reviewschema = new mongoose.Schema({
	review : {
		type:String,
		required : [true,'Review cannot be empty']
	},
	rating : {
		type:Number,
		min:1,
		max:5
	},
	createdAt : {
		type:Date,
		default :Date.now(),
	},
	tour : {
		type : mongoose.Schema.ObjectId,
		ref : 'Tour',
		required : [true,'tour name cannot be empty']
	},
	user : {
		type : mongoose.Schema.ObjectId,
		ref : 'User',
		required : [true,'user cannot be empty']
	},
})

reviewschema.index({tour:1,user:1},{unique: true})  

reviewschema.statics.calcAvgrating = async function(tourid){
	const stats = await this.aggregate([

					{
						$match : {tour : tourid}
					},
					{
						$group : {
							_id : '$tour',
							nratings : {$sum : 1},
							avgratings : {$avg : '$rating'}
						}
					}
				])
	if(stats.length > 0)
	{
		await Tour.findByIdAndUpdate(tourid,{
		ratingsAverage : stats[0].avgratings,
		ratingsQuantity : stats[0].nratings
	})
	}
	else
	{ 
		await Tour.findByIdAndUpdate(tourid,{   
		ratingsAverage : 4.5,
		ratingsQuantity : 0
	})
	}


}

reviewschema.post('save', async function(){
	await this.constructor.calcAvgrating(this.tour)
})

reviewschema.post(/^findOneAnd^/, async function(doc){
	await doc.constructor.calcAvgrating(doc.tour);
})



reviewschema.pre(/^find/,function(next){
	this.populate({
		path : 'user',
		select : 'name'
	})
	next()
})

const Review = mongoose.model('Review',reviewschema);


module.exports = Review;