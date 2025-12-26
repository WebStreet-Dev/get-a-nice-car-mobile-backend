import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json({
    success: true,
    ...response,
  });
}

/**
 * Send a created response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no content response
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}




