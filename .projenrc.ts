import { javascript } from "projen";
import { CdktfTypeScriptApp } from "projen-cdktf-app-ts";
const project = new CdktfTypeScriptApp({
  cdktfVersion: "0.20.1",
  defaultReleaseBranch: "main",
  depsUpgradeOptions: { workflow: false },
  devDeps: ["projen-cdktf-app-ts"],
  eslint: true,
  name: "cdktf-project",
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: "8.14.2",
  prettier: true,
  projenrcTs: true,

  terraformProviders: [
    "hashicorp/aws@~> 5.33.0",
    "kreuzwerker/docker@~> 3.0.2",
  ],
});
project.synth();
