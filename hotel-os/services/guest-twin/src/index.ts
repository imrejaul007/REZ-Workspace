import { Container } from 'typescript-ioc';
import { GuestTwinService } from './services/GuestTwinService';
import { GuestTwinRepository } from './services/GuestTwinRepository';
import { GuestTwinController } from './routes/GuestTwinController';
import { MessageBroker } from './services/MessageBroker';
import { DatabaseService } from './services/DatabaseService';
import { ConfigService } from './services/ConfigService';
import { Logger } from './services/Logger';

// Configure dependency injection
Container.bind(GuestTwinRepository).to(GuestTwinRepository);
Container.bind(GuestTwinService).to(GuestTwinService);
Container.bind(GuestTwinController).to(GuestTwinController);
Container.bind(MessageBroker).to(MessageBroker);
Container.bind(DatabaseService).to(DatabaseService);
Container.bind(ConfigService).to(ConfigService);
Container.bind(Logger).to(Logger);

export { Container };
export { GuestTwinService } from './services/GuestTwinService';
export { GuestTwinRepository } from './services/GuestTwinRepository';
export { GuestTwinController } from './routes/GuestTwinController';
export { MessageBroker } from './services/MessageBroker';
export { DatabaseService } from './services/DatabaseService';
export { ConfigService } from './services/ConfigService';
export { Logger } from './services/Logger';