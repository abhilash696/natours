const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify')

const tourschema = new mongoose.Schema({
 name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength : [40,'Name should have lesss than or equal to 40 characters'],
      minlength : [7,'Name should have more than 6 characters'],
    },
    slug:String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
      min:[6,'must be minimum 6 members for a group']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum : {
      	values : ['easy','difficult','medium'],
      	message: 'must be either easy difficult or medium'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      set : val => Math.round(val*10)/10 
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate :{                                     ///custom validator
      	validator : function(value){
      		return this.price > value;
      	},
      	message : 'price should be always greater than price_discount'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides : [
    {
    	type:mongoose.Schema.ObjectId,
    	ref:'User'
    }]},
    {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });


tourschema.pre('save',function(next){
	this.slug = slugify(this.name,{lower:true});
	next()
})

tourschema.pre(/^find/,function(next){
	this.populate({
		path : 'guides',
		select : '-_v -passwordChangedAt'
	})
	next()
})

tourschema.index({slug:1})
tourschema.index({startLocation:'2dsphere'})


tourschema.virtual('reviews',{
	ref:'Review',
	foreignField : 'forTour',
	localField : '_id'
})

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourschema);
module.exports = Tour;