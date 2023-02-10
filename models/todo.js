const mongoose = require('mongoose')

const {Schema} = mongoose

const userSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
        
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    author : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('User', userSchema)