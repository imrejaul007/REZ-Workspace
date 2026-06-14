import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import resolvers
import { UserResolver } from './resolvers/user.resolver';
import { RestaurantResolver } from './resolvers/restaurant.resolver';
import { JobResolver } from './resolvers/job.resolver';
import { OrderResolver } from './resolvers/order.resolver';

// Import services
import { UsersModule } from '../modules/users/users.module';
import { RestaurantsModule } from '../modules/restaurants/restaurants.module';
import { JobsModule } from '../modules/jobs/jobs.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'schema.gql'),
        sortSchema: true,
        playground: configService.get('NODE_ENV') === 'development',
        introspection: true,
        context: ({ req, res }) => ({
          req,
          res,
          user: req.user,
        }),
        formatError: (error) => {
          // Don't expose internal errors in production
          if (configService.get('NODE_ENV') === 'production') {
            delete error.extensions?.exception?.stacktrace;
          }
          return error;
        },
        cors: {
          origin: configService.get('NODE_ENV') === 'production'
            ? configService.get('ALLOWED_ORIGINS', '').split(',')
            : true,
          credentials: true,
        },
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
          },
          'subscriptions-transport-ws': {
            path: '/graphql',
          },
        },
        installSubscriptionHandlers: true,
      }),
      inject: [ConfigService],
    }),

    // Import necessary modules
    UsersModule,
    RestaurantsModule,
    JobsModule,
    OrdersModule,
    AuthModule,
  ],
  providers: [
    UserResolver,
    RestaurantResolver,
    JobResolver,
    OrderResolver,
  ],
})
export class GraphQLApiModule {}