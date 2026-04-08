import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * AuthUser Decorator
 * =================
 * Usage:
 *  @AuthUser() → full user object
 *  @AuthUser('userId') → specific field
 */
export const AuthUser = createParamDecorator(
  (data: keyof any | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      return null; // or throw if you want strict behavior
    }

    return data ? user[data] : user;
  },
);
