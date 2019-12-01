import * as process from 'process';
import * as cp from 'child_process';
import * as path from 'path';

describe('run', () => {
  const mainJsPath = path.join(__dirname, '..', 'lib', 'main.js');

  beforeEach(() => {
    process.env['INPUT_CHARTNAME'] = 'fakechart';
    process.env['INPUT_CHARTSLOCATION'] = path.join(__dirname, 'fixtures', 'charts');
    process.env['INPUT_RELEASESLOCATION'] = path.join(__dirname, 'fixtures', 'releases');
  });

  test('without publish and templates', () => {
    const options: cp.ExecSyncOptions = {
      env: process.env,
    };
    console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
  });

  test('with templates', () => {
    process.env['INPUT_CHARTVALUEFILES'] =
      `["${path.join(__dirname, 'fixtures', 'fake-values.yaml')}"]`;
    const options: cp.ExecSyncOptions = {
      env: process.env,
    };
    console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
  });

  // TODO - The publish part might change, currently it is difficult to test
  test.skip('with publish', () => {
    process.env['INPUT_PUBLISH'] = 'true';
    process.env['INPUT_GITHUBTOKEN'] = 'fakeToken';

    const options: cp.ExecSyncOptions = {
      env: process.env,
    };
    console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
  });
});
