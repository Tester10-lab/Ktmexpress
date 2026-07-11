import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

class EnterpriseEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

const eventBus = new EnterpriseEventBus();

// Log event registration
eventBus.on('newListener', (event) => {
  logger.info(`Event subscriber registered for event: ${event}`);
});

export default eventBus;
