/**
 * Custom Jest environment for React Native
 * Uses the project's jest-environment-node (v27) which is compatible with jest@27
 */

const NodeEnvironment = require('jest-environment-node');

class CustomRNEnvironment extends NodeEnvironment {
  constructor(config, context) {
    config.testEnvironmentOptions = config.testEnvironmentOptions || {};
    super(config, context);
    this.customExportConditions = ['require', 'react-native'];
  }
}

module.exports = CustomRNEnvironment;
