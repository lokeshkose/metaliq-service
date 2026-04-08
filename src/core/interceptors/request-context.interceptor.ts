import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { RequestContextStore } from 'src/core/context/request-context';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    return new Observable((subscriber) => {
      const user = req.user;
      RequestContextStore.run(() => {
        RequestContextStore.set({
          userId: user?.userId,
          profileId: user?.profileId,
          name: user?.name,
          email: user?.email,
          roleId: user?.roleId,
          roleName: user?.roleName,
          mobile: user?.mobile,
          permissions: user.permissions,
          userType: user.userType,
          isActive: user.isActive,
          roleStatus: user.roleStatus,
          deviceId: user?.deviceId,
          sessionId: user.sessionId,
        });

        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
