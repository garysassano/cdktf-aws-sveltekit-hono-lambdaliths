import { javascript } from "projen";
import { CdktfTypeScriptApp } from "projen-cdktf-app-ts";

const project = new CdktfTypeScriptApp({
  cdktfVersion: "0.20",
  defaultReleaseBranch: "main",
  depsUpgradeOptions: { workflow: false },
  devDeps: ["projen-cdktf-app-ts"],
  eslint: true,
  minNodeVersion: "20.18.0",
  name: "cdktf-aws-nest-nuxt-lambdaliths",
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: "9",
  prettier: true,
  projenrcTs: true,

  terraformProviders: [
    "hashicorp/aws@~> 5.73.0",
    "kreuzwerker/docker@~> 3.0.2",
    "upstash/upstash@~> 1.5.3",
  ],
});

// Generate CDKTF constructs after installing deps
project.tasks.tryFind("install")?.spawn(project.cdktfTasks.get);

project.synth();
