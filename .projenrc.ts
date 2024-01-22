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

  deps: ["@cdktf/provider-aws@19.2.0"],
});
project.synth();
