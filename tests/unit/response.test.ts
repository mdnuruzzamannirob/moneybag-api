import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { Response } from 'express';
import { sendResponse, AppError } from '../../src/utils/response.js';

describe('Response Utility', () => {
  describe('sendResponse', () => {
    let mockResponse: Pick<Response, 'status' | 'json'>;

    beforeEach(() => {
      mockResponse = {
        status: vi.fn(() => mockResponse) as unknown as Response['status'],
        json: vi.fn() as unknown as Response['json'],
      };
    });

    it('should send a successful response with standard body', () => {
      sendResponse(mockResponse as Response, 200, 'Success Message', { id: 1 });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success Message',
        data: { id: 1 },
      });
    });

    it('should handle response without data', () => {
      sendResponse(mockResponse as Response, 204, 'No Content');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'No Content',
      });
    });

    it('should set success to false for error status codes', () => {
      sendResponse(mockResponse as Response, 400, 'Bad Request');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request',
      });
    });

    it('should include meta object when provided', () => {
      sendResponse(mockResponse as Response, 200, 'With Meta', [], { page: 1 });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'With Meta',
        data: [],
        meta: { page: 1 },
      });
    });
  });

  describe('AppError', () => {
    it('should create an instance of AppError with custom properties', () => {
      const error = new AppError(404, 'Not Found');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Not Found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });
  });
});
