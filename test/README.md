# SWD Pulse Test Suite

This directory contains the comprehensive test suite for the SWD Pulse application.

## Test Structure

- `app.test.js` - Unit tests for the main application endpoints
- `integration.test.js` - Integration tests covering end-to-end scenarios
- `setup.js` - Jest setup file for test environment configuration

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest test/app.test.js

# Run tests with verbose output
npx jest --verbose
```

### Test Coverage

The test suite includes coverage reporting for:
- Line coverage
- Function coverage  
- Branch coverage
- Statement coverage

Coverage reports are generated in the `coverage/` directory.

## Test Categories

### Unit Tests (`app.test.js`)
- Basic endpoint functionality
- Response format validation
- Error handling for non-existent routes
- Server configuration validation

### Integration Tests (`integration.test.js`)
- Application health checks
- Concurrent request handling
- Error handling under various conditions
- Security header validation
- CORS preflight handling

## Test Environment

- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Test Environment**: Node.js
- **Coverage Tool**: Jest built-in coverage

## Best Practices

1. **Test Naming**: Use descriptive test names that clearly indicate what is being tested
2. **Test Isolation**: Each test should be independent and not rely on other tests
3. **Assertions**: Use specific assertions with clear error messages
4. **Setup/Teardown**: Use Jest's setup and teardown hooks for test preparation
5. **Mocking**: Mock external dependencies to ensure test reliability

## Continuous Integration

The test suite is designed to work with CI/CD pipelines:
- Fast execution for quick feedback
- Clear pass/fail indicators
- Coverage reporting for quality metrics
- Parallel test execution support

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Tests run in isolation, but ensure no other services are using port 3000 during testing
2. **Environment Variables**: Tests set `NODE_ENV=test` automatically
3. **Coverage Issues**: Ensure all source files are properly included in the coverage configuration

### Debugging Tests

```bash
# Run tests with debug output
npx jest --verbose --no-coverage

# Run a specific test with debug info
npx jest test/app.test.js --verbose -t "should return Hello World message"