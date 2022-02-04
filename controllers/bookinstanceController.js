var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body, validationResult } = require('express-validator');
var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res) {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) {
                return next(err);
            }
            // Successful, so render
            res.render('bookinstance_list', {
                title: 'Book Instance List',
                bookinstance_list: list_bookinstances,
            });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', {
                title: `Copy: ${bookinstance.book.title}`,
                bookinstance: bookinstance,
            });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res) {
    Book.find({}, 'title').exec((err, books) => {
        if (err) {
            return next(err);
        }
        res.render('bookinstance_form', {
            title: 'Create BookInstance',
            book_list: books,
        });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec((err, books) => {
                if (err) {
                    return next(err);
                }
                res.render('bookinstance_form', {
                    title: 'Create BookInstance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        } else {
            bookinstance.save((err) => {
                if (err) {
                    return next(err);
                }
                res.redirect(bookinstance.url);
            });
        }
    },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                res.redirect('/catalog/bookinstances');
            }
            res.render('bookinstance_delete', {
                title: 'Delete BookInstance',
                bookinstance: bookinstance,
            });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res) {
    BookInstance.findById(req.body.bookinstanceid)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }
            BookInstance.findByIdAndRemove(
                req.body.bookinstanceid,
                function deleteBookInstance(err) {
                    if (err) {
                        return next(err);
                    }
                    // Success - go to book instances list
                    res.redirect('/catalog/bookinstances');
                }
            );
        });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
    // Get book, authors and genres for form.
    async.parallel(
        {
            bookinstance: (callback) => {
                BookInstance.findById(req.params.id)
                    .populate('book')
                    .exec(callback);
            },
            books: (callback) => {
                Book.find(callback);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.bookinstance == null) {
                var err = new Error('Book Instance not found');
                err.status = 404;
                return next(err);
            }
            // Success
            res.render('bookinstance_form', {
                title: 'Update Book',
                bookinstance: results.bookinstance,
                book_list: results.books,
            });
        }
    );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('status').escape(),
    body('due_back', 'Invalid date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization
    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title').exec((err, books) => {
                if (err) {
                    return next(err);
                }
                res.render('bookinstance_form', {
                    title: 'Update BookInstance',
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        } else {
            BookInstance.findByIdAndUpdate(
                req.params.id,
                bookinstance,
                {},
                (err, thebookinstance) => {
                    if (err) {
                        return next(err);
                    }
                    // Successful - redirect to book instances detail page
                    res.redirect(thebookinstance.url);
                }
            );
        }
    },
];
