import { javascript } from "projen";
import { CdktfTypeScriptApp } from "projen-cdktf-app-ts";

const project = new CdktfTypeScriptApp({
  cdktfVersion: "0.20.11",
  defaultReleaseBranch: "main",
  depsUpgradeOptions: { workflow: false },
  devDeps: ["projen-cdktf-app-ts", "zod"],
  eslint: true,
  gitignore: ["*.tfstate*"],
  minNodeVersion: "22.13.0",
  name: "cdktf-aws-sveltekit-hono-lambdaliths",
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: "9",
  prettier: true,
  projenrcTs: true,

  terraformProviders: [
    "hashicorp/aws@~> 5.84.0",
    "kreuzwerker/docker@~> 3.0.2",
    "upstash/upstash@~> 1.5.3",
  ],
});

// Generate CDKTF constructs after installing deps
project.tasks.tryFind("install")?.spawn(project.cdktfTasks.get);

project.synth();
