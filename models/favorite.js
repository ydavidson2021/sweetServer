const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const favoriteSchema = new Schema({
    user: {
        type: type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    sweet: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sweet'
    }]
}, {
    timestamps: true
});

const Favorite= mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;