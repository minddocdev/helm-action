import * as core from '@actions/core';
import * as github from '@actions/github';
import { exec } from 'shelljs';
import { oneLine, oneLineTrim } from 'common-tags';

function getValueFiles(files) {
  let fileList: string[];
  if (typeof files === 'string') {
    try {
      fileList = JSON.parse(files);
    } catch (err) {
      // Assume it's a single string.
      fileList = [files];
    }
  } else {
    fileList = files;
  }
  if (!Array.isArray(fileList)) {
    return [];
  }
  return fileList.filter(f => !!f);
}

async function run() {
  try {
    const context = github.context;
    const chartsLocation = core.getInput('chartsLocation') || 'helm/charts';
    const chartName = core.getInput('chartName');
    const chartValueFiles = getValueFiles(core.getInput('chartValueFiles'));
    const githubEmail = core.getInput('githubEmail') || 'android18@minddoc.de';
    const githubUser = core.getInput('githubUser') || 'minddocbot';
    const githubUsername = core.getInput('githubUsername') || 'Android 18';
    const githubToken = core.getInput('githubToken');
    const publish = core.getInput('publish') === 'true' || false;
    const releasesLocation = core.getInput('releasesLocation') || 'helm/releases';

    core.info(`Updating ${chartName} chart dependencies`);
    if (exec(`helm dependency update ${chartsLocation}/${chartName}`).code !== 0) {
      throw new Error(`Unable to update ${chartName} helm dependencies`);
    }

    core.info(`Checking ${chartName} chart for possible issues`);
    if (exec(`helm lint ${chartsLocation}/${chartName}`).code !== 0) {
      throw new Error(`Chart ${chartName} has lint issues`);
    }

    if (chartValueFiles) {
      core.info(`Trying to render ${chartName} chart templates with provided values`);
      const valueFilesString = chartValueFiles
        .map(valueFile => `-f ${valueFile}`)
        .join(' ');
      if (
        exec(`helm template ${valueFilesString} ${chartsLocation}/${chartName}`).code !== 0
      ) {
        throw new Error(`Chart ${chartName} template could not be rendered`);
      }
    }

    if (publish) {
      core.info(`Trying to create ${chartName} chart package`);
      if (exec(oneLine`
        helm package
          "${chartsLocation}/${chartName}"
          -d "${releasesLocation}/${chartName}"
      `).code !== 0) {
        throw new Error(`Chart ${chartName} package could not be created`);
      }
      if (exec(`helm repo index "${releasesLocation}/${chartName}"`).code !== 0) {
        throw new Error(`Chart ${chartName} package could not be indexed in the desired repo`);
      }
      exec(`git config --local user.name ${githubUsername}`);
      exec(`git config --local user.email ${githubEmail}`);
      exec(`git config --local github.email ${githubEmail}`);
      exec(`git config --local github.user ${githubUser}`);
      const version = exec(
        `helm inspect chart "${chartsLocation}/${chartName}" | grep version | tr -d 'version: ' `,
      ).stdout;
      core.info(`Preparing release commit for ${chartName} chart with version ${version}`);
      exec(oneLine`
        git add
          "${releasesLocation}/${chartName}/index.yaml"
          "${releasesLocation}/${chartName}/${chartName}-${version}.tgz"
      `);
      exec(`git commit -m "Release ${chartName} package with version ${version}"`);
      // exec(`git tag "chart-${chartName}-${version}-${context.sha}"`);
      const repository = oneLineTrim`
        https://${context.actor}:${githubToken}@github.com/
        ${context.repo.owner}/${context.repo.repo}
      `;
      exec(`git push "${repository}" HEAD:${context.ref} --follow-tags`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
