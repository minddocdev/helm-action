# Helm Action

Install the dependencies

```bash
yarn install
```

Build the typescript

```bash
yarn build
```

Run the tests :heavy_check_mark:

```bash
yarn test
```

## Usage

Add check chart step to your flow

```yaml
- name: Check chart
  uses: minddocdev/helm-action@master
  with:
    chartName: myChart
    chartValueFiles:
      - 'myPath/my-values.yaml'
```

Add check chart step to your flow (and publish afterwards)

```yaml
- name: Publish chart
  uses: minddocdev/helm-action@master
  with:
    chartName: myChart
    githubToken: ${{ secrets.MY_GITHUB_TOKEN }}
    publish: 'true'
```
