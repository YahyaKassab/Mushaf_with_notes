const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createMushaf: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    settings: Joi.object({
      isPublic: Joi.boolean().optional(),
      allowCollaboration: Joi.boolean().optional(),
      theme: Joi.string().optional()
    }).optional()
  }),

  createNote: Joi.object({
    title: Joi.string().max(200).required(),
    content: Joi.string().max(2000).required(),
    mushaf: Joi.string().required(),
    page: Joi.string().required(),
    position: Joi.object({
      lineNumber: Joi.number().required(),
      x: Joi.number().optional(),
      y: Joi.number().optional()
    }).required(),
    category: Joi.string().valid('memorization', 'tajweed', 'general', 'reflection').optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    color: Joi.string().optional()
  }),

  createWordInteraction: Joi.object({
    mushaf: Joi.string().required(),
    page: Joi.string().required(),
    wordId: Joi.string().required(),
    interactionType: Joi.string().valid('underline', 'highlight', 'bookmark').required(),
    style: Joi.object({
      color: Joi.string().optional(),
      thickness: Joi.number().optional(),
      opacity: Joi.number().min(0).max(1).optional()
    }).optional()
  }),

  createLetterMark: Joi.object({
    mushaf: Joi.string().required(),
    page: Joi.string().required(),
    wordId: Joi.string().required(),
    letterPosition: Joi.number().min(0).required(),
    markType: Joi.string().valid('circle', 'underline', 'highlight', 'cross').required(),
    coordinates: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      radius: Joi.number().optional()
    }).required(),
    style: Joi.object({
      color: Joi.string().optional(),
      thickness: Joi.number().optional(),
      opacity: Joi.number().min(0).max(1).optional()
    }).optional(),
    category: Joi.string().valid('tajweed', 'mistake', 'emphasis', 'question').optional(),
    note: Joi.string().max(500).optional()
  })
};

module.exports = { validate, schemas };