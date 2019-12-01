"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const shelljs_1 = require("shelljs");
const common_tags_1 = require("common-tags");
function getValueFiles(files) {
    let fileList;
    if (typeof files === 'string') {
        try {
            fileList = JSON.parse(files);
        }
        catch (err) {
            // Assume it's a single string.
            fileList = [files];
        }
    }
    else {
        fileList = files;
    }
    if (!Array.isArray(fileList)) {
        return [];
    }
    return fileList.filter(f => !!f);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const chartsLocation = core.getInput('chartsLocation') || 'helm/charts';
            const chartName = core.getInput('chartName');
            const chartValueFiles = getValueFiles(core.getInput('chartValueFiles'));
            const githubEmail = core.getInput('githubEmail') || 'android18@minddoc.de';
            const githubUser = core.getInput('githubUser') || 'minddocbot';
            const githubToken = core.getInput('githubToken');
            const publish = core.getInput('publish') === 'true' || false;
            const releasesLocation = core.getInput('releasesLocation') || 'helm/releases';
            core.info(`Updating ${chartName} chart dependencies`);
            if (shelljs_1.exec(`helm dependency update ${chartsLocation}/${chartName}`).code !== 0) {
                throw new Error(`Unable to update ${chartName} helm dependencies`);
            }
            core.info(`Checking ${chartName} chart for possible issues`);
            if (shelljs_1.exec(`helm lint ${chartsLocation}/${chartName}`).code !== 0) {
                throw new Error(`Chart ${chartName} has lint issues`);
            }
            if (chartValueFiles) {
                core.info(`Trying to render ${chartName} chart templates with provided values`);
                const valueFilesString = chartValueFiles
                    .map(valueFile => `-f ${valueFile}`)
                    .join(' ');
                if (shelljs_1.exec(`helm template ${valueFilesString} ${chartsLocation}/${chartName}`).code !== 0) {
                    throw new Error(`Chart ${chartName} template could not be rendered`);
                }
            }
            if (publish) {
                core.info(`Trying to create ${chartName} chart package`);
                if (shelljs_1.exec(common_tags_1.oneLine `
        helm package
          "${chartsLocation}/${chartName}"
          -d "${releasesLocation}/${chartName}"
      `).code !== 0) {
                    throw new Error(`Chart ${chartName} package could not be created`);
                }
                if (shelljs_1.exec(`helm repo index "${releasesLocation}/${chartName}"`).code !== 0) {
                    throw new Error(`Chart ${chartName} package could not be indexed in the desired repo`);
                }
                shelljs_1.exec(`git config --local github.user ${githubUser}`);
                shelljs_1.exec(`git config --local github.email ${githubEmail}`);
                shelljs_1.exec(`git config --local github.user ${githubUser}`);
                const version = shelljs_1.exec(`helm inspect chart "${chartsLocation}/${chartName}" | grep version | tr -d 'version: ' `).stdout;
                core.info(`Preparing release commit for ${chartName} chart with version ${version}`);
                shelljs_1.exec(common_tags_1.oneLine `
        git add
          "${releasesLocation}/${chartName}/index.yaml"
          "${releasesLocation}/${chartName}/${chartName}-${version}.tgz"
      `);
                shelljs_1.exec(`git commit -m "Release ${chartName} package with version ${version}"`);
                // exec(`git tag "chart-${chartName}-${version}-${context.sha}"`);
                const repository = common_tags_1.oneLineTrim `
        https://${context.actor}:${githubToken}@github.com/
        ${context.repo.owner}/${context.repo.repo}
      `;
                shelljs_1.exec(`git push "${repository}" HEAD:${context.ref} --follow-tags`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
