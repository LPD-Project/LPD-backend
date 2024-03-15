import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { UserModule } from './user/user.module';
import { DeviceModule } from './device/device.module';
import { UserController } from './user/user.controller';
import { DeviceController } from './device/device.controller';
import { UserService } from './user/user.service';
import { DeviceService } from './device/device.service';


@Module({
  imports: [FirebaseModule, GatewayModule, AuthModule, UserModule, DeviceModule],
  controllers: [AppController, AuthController, UserController, DeviceController],
  providers: [AppService, AuthService, UserService, DeviceService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthMiddleware)
    .exclude(
      { path: '/auth/createUser', method: RequestMethod.ALL },
      { path: '/auth/user/upload/image', method: RequestMethod.ALL },
    )
    .forRoutes('*');
  }
}
