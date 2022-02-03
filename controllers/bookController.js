var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = function (req, res) {
    async.parallel(
        {
            book_count: (callback) => {
                // Pass an empty object as match condition to find all documents
                // of this collection
                Book.countDocuments({}, callback);
            },
            book_instance_count: (callback) => {
                BookInstance.countDocuments({}, callback);
            },
            book_instance_available_count: (callback) => {
                BookInstance.countDocuments({ status: 'Available' }, callback);
            },
            author_count: (callback) => {
                Author.countDocuments({}, callback);
            },
            genre_count: (callback) => {
                Genre.countDocuments({}, callback);
            },
        },
        (err, results) => {
            res.render('index', {
                title: 'Local Library Home',
                error: err,
                data: results,
            });
        }
    );
};

// Display list of all books.
exports.book_list = function (req, res) {
    Book.find({}, 'title author')
        .sort({ title: 1 })
        .populate('author')
        .exec((err, list_books) => {
            if (err) {
                return next(err);
            }
            // Successful, so render
            res.render('book_list', {
                title: 'Book List',
                book_list: list_books,
            });
        });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res) {
    async.parallel(
        {
            book: (callback) => {
                Book.findById(req.params.id)
                    .populate('author')
                    .populate('genre')
                    .exec(callback);
            },
            book_instance: (callback) => {
                BookInstance.find({ book: req.params.id }).exec(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            res.render('book_detail', {
                title: results.book.title,
                book: results.book,
                book_instances: results.book_instance,
            });
        }
    );
};

// Display book create form on GET.
exports.book_create_get = function (req, res) {
    // Get all authors and genres, which we can use for adding our book
    async.parallel(
        {
            authors: (callback) => {
                Author.find(callback);
            },
            genres: (callback) => {
                Genre.find(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            res.render('book_form', {
                title: 'Create Book',
                authors: results.authors,
                genres: results.genres,
            });
        }
    );
};

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },

    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a new Book object with escaped and trimmed data.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if (!errors.isEmpty()) {
            // Render form again with santized values/error messages.
            async.parallel(
                {
                    authors: (callback) => {
                        Author.find(callback);
                    },
                    genres: (callback) => {
                        Genre.find(callback);
                    },
                },
                (err,
                (results) => {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = 'true';
                        }
                    }
                    res.render('book_form', {
                        title: 'Create Book',
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array(),
                    });
                })
            );
            return;
        } else {
            // Data from this form is valid. Save book.
            book.save((err) => {
                if (err) {
                    return next(err);
                }
                //successful - redirect to new book record.
                res.redirect(book.url);
            });
        }
    },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};
