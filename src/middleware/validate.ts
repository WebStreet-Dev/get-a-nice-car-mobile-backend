import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'value';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        sendError(res, 'Validation failed', 400, errors);
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate multiple targets
 */
export function validateAll(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      try {
        const data = req[target as ValidationTarget];
        const validated = schema.parse(data);
        req[target as ValidationTarget] = validated;
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            const path = `${target}.${err.path.join('.')}` || target;
            if (!errors[path]) {
              errors[path] = [];
            }
            errors[path].push(err.message);
          });
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      sendError(res, 'Validation failed', 400, errors);
      return;
    }

    next();
  };
}








