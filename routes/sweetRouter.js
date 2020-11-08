const express = require('express');
const bodyParser = require('body-parser');
const Sweet= require('../models/sweet');
const authenticate = require('../authenticate');
const cors = require('./cors'); //created cors

const sweeteRouter = express.Router();

sweetRouter.use(bodyParser.json());

sweetRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200)) //preflight request with http options method 
.get(cors.cors, (req, res, next) => {
    Sweet.find()
    .populate('comments.author')
    .then(sweets => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(sweets);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
    Sweet.create(req.body)
    .then(sweet => {
        console.log('Sweet Created ', sweet);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(sweet);
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /sweets');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Sweet.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

sweetRouter.route('/:sweetId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .populate('comments.author')
    .then((sweet => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(sweet);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /sweets/${req.params.sweetId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Sweet.findByIdAndUpdate(req.params.sweetId, {
        $set: req.body
    }, { new: true })
    .then(sweet => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Sweet.findByIdAndDelete(req.params.sweetId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch(err => next(err));
});

//handle comments
sweetRouter.route('/:sweetId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .populate('comments.author')
    .then(sweet => {
        if (sweet) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(sweet.comments);
        } else {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404; 
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .then(sweet => {
        if (sweet) {
            req.body.author = req.user._id;
            sweet.comments.push(req.body);
            sweet.save() // save to mongodb database - not static , not uppercase - returns a promise
            .then (sweet => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(sweet.comments);
            })
            .catch(err => next(err));            
        } else {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404; 
            return next(err);
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /sweets/${req.params.sweetId}/comments`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .then(sweet => {
        if (sweet) {
            for (let i = (sweet.comments.length-1); i >= 0; i--) {
                sweet.comments.id(sweet.comments[i]._id).remove();
            }
            sweet.save()
            .then(sweet => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(sweet);
            })
            .catch(err => next(err));
        } else {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

//specific commentId
sweetRouter.route('/:sweetId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .populate('comments.author')
    .then(sweet => {
        if (sweet && sweet.comments.id(req.params.commentId)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(sweet.comments.id(req.params.commentId));
        } else if (!sweet) {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /sweets/${req.params.sweetId}/comments/${req.params.commentId}`);
})
//update existing data - only comment text and rating fields 
//Task 4 --- workshop 
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .then(sweet => {
        if (sweet && sweet.comments.id(req.params.commentId)) {
            if((sweet.comments.id(req.params.commentId).author._id).equals(req.user._id)) {
                if (req.body.rating) {
                    sweet.comments.id(req.params.commentId).rating = req.body.rating;
                }
                if (req.body.text) {
                    sweet.comments.id(req.params.commentId).text = req.body.text;
                }
                sweet.save()
                .then(sweet => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(sweet);
                })
                .catch(err => next(err));
            } else {
                err = new Error('You are not authorized to edit this comment');
                err.status = 403; 
                return next(err);
            }
        } else if (!sweet) {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Sweet.findById(req.params.sweetId)
    .then(sweet => {
        if (sweet && sweet.comments.id(req.params.commentId)) {
            if((sweet.comments.id(req.params.commentId).author._id). equals(req.user._id)) {
                sweet.comments.id(req.params.commentId).remove();
                sweet.save()
                .then(sweet => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(sweet);
                })
                .catch(err => next(err));
            } else {
                err = new Error ('You are not authorized to delete this comment');
                err.status = 403; 
                return next(err);
            }
        } else if (!sweet) {
            err = new Error(`Sweet ${req.params.sweetId} not found`);
            err.status = 404;
            return next(err);
        } else {
            err = new Error(`Comment ${req.params.commentId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = sweetRouter;