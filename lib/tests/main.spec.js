"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const process = __importStar(require("process"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
describe('run', () => {
    const mainJsPath = path.join(__dirname, '..', 'lib', 'main.js');
    beforeEach(() => {
        process.env['INPUT_CHARTNAME'] = 'fakechart';
        process.env['INPUT_CHARTSLOCATION'] = path.join(__dirname, 'fixtures', 'charts');
        process.env['INPUT_RELEASESLOCATION'] = path.join(__dirname, 'fixtures', 'releases');
    });
    test('without publish and templates', () => {
        const options = {
            env: process.env,
        };
        console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
    });
    test('with templates', () => {
        process.env['INPUT_CHARTVALUEFILES'] = `["${path.join(__dirname, 'fake-values.yaml')}"]`;
        const options = {
            env: process.env,
        };
        console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
    });
    // TODO - The publish part might change, currently it is difficult to test
    test.skip('with publish', () => {
        process.env['INPUT_PUBLISH'] = 'true';
        process.env['INPUT_GITHUBTOKEN'] = 'fakeToken';
        const options = {
            env: process.env,
        };
        console.log(cp.execSync(`node ${mainJsPath}`, options).toString());
    });
});
