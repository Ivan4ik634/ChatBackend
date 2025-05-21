import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      '207.97.227.239';

    console.log(ip);
    return ip;
  },
);
