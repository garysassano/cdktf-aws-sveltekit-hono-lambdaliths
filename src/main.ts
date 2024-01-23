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

    new AwsProvider(this, "aws", {});

    new EcrRepository(this, "my-ecr-repo", {
      name: "my-ecr-repo",
    });

    const token = new DataAwsEcrAuthorizationToken(this, "token", {});

    new DockerProvider(this, "docker", {
      registryAuth: [
        {
          address: token.proxyEndpoint,
          password: token.password,
          username: token.userName,
        },
      ],
    });

    const myDockerImage = new Image(this, "my-docker-image", {
      buildAttribute: { context: path.join(__dirname, "back") },
      name: "${" + token.proxyEndpoint + "}/my-ecr-repo:latest",
      platform: "linux/arm64",
    });

    new RegistryImage(this, "media-handler", {
      name: myDockerImage.name,
    });
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");

app.synth();
