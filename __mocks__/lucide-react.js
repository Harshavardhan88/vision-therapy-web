const React = require('react');

module.exports = new Proxy({}, {
    get: function (target, prop) {
        return function MockIcon(props) {
            return React.createElement('div', Object.assign({ 'data-testid': `icon-${String(prop)}` }, props));
        };
    }
});
