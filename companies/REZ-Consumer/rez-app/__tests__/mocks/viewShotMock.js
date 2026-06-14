/**
 * Mock for react-native-view-shot
 */
const React = require('react');

module.exports = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    capture: jest.fn(() => Promise.resolve('file:///mock/path/qr.png')),
  }));
  return React.createElement('View', props, props.children);
});
