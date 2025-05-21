import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const isUndefined = request.user === undefined;
    if (isUndefined) throw new UnauthorizedException('User is not defined');
    return request.user;
  },
);
