import path from "path";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { DataAwsEcrAuthorizationToken } from "../.gen/providers/aws/data-aws-ecr-authorization-token";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { AwsProvider } from "../.gen/providers/aws/provider";
import { Image } from "../.gen/providers/docker/image";
import { DockerProvider } from "../.gen/providers/docker/provider";
import { RegistryImage } from "../.gen/providers/docker/registry-image";

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "aws");

    const backRepo = new EcrRepository(this, "back-repo", {
      name: "back-repo",
    });

    const frontRepo = new EcrRepository(this, "front-repo", {
      name: "front-repo",
    });

    const token = new DataAwsEcrAuthorizationToken(this, "token");

    new DockerProvider(this, "docker", {
      registryAuth: [
        {
          address: token.proxyEndpoint,
          password: token.password,
          username: token.userName,
        },
      ],
    });

    const backImage = new Image(this, "back-image", {
      buildAttribute: { context: path.join(__dirname, "back") },
      name: backRepo.repositoryUrl,
      platform: "linux/arm64",
    });

    const frontImage = new Image(this, "front-image", {
      buildAttribute: { context: path.join(__dirname, "front") },
      name: frontRepo.repositoryUrl,
      platform: "linux/arm64",
    });

    new RegistryImage(this, "back-upload", {
      name: backImage.name,
    });

    new RegistryImage(this, "front-upload", {
      name: frontImage.name,
    });
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");

app.synth();
