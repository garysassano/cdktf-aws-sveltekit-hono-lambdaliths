import { javascript } from "projen";
import { CdktfTypeScriptApp } from "projen-cdktf-app-ts";
const project = new CdktfTypeScriptApp({
  cdktfVersion: "0.20.1",
  defaultReleaseBranch: "main",
  devDeps: ["projen-cdktf-app-ts"],
  eslint: true,
  name: "cdktf-project",
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: "8.14.2",
  prettier: true,
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
