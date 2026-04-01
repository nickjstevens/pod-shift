import type { H3Event } from "h3";
import { setResponseStatus } from "h3";

export type ApiResult<T> = {
  statusCode: number;
  body: T;
};

export function ok<T>(body: T, statusCode = 200): ApiResult<T> {
  return {
    statusCode,
    body
  };
}

export function sendResult<T>(event: H3Event, result: ApiResult<T>) {
  setResponseStatus(event, result.statusCode);
  return result.body;
}
