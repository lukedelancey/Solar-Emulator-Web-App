// Polyfill for TextEncoder/TextDecoder needed by MSW in Jest environment
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Simple fetch polyfill for testing
global.fetch = global.fetch || require('node-fetch');