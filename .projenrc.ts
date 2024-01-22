import { javascript } from 'projen';
import { CdktfTypeScriptApp } from 'projen-cdktf-app-ts';
const project = new CdktfTypeScriptApp({
  defaultReleaseBranch: 'main',
  devDeps: ['projen-cdktf-app-ts'],
  name: 'cdktf-project',
  packageManager: javascript.NodePackageManager.PNPM,
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();