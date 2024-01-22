import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new AwsProvider(this, "aws", {});
    new EcrRepository(this, "my-ecr-repo", {
      name: "my-ecr-repo",
    });
    const token = new DataAwsEcrAuthorizationToken(this, "token", {});
    new DockerProvider(this, "docker", {
      registry_auth: [
        {
          address: token.proxyEndpoint,
          password: token.password,
          username: token.userName,
        },
      ],
    });
    const myDockerImage = new Image(this, "my-docker-image", {
      build: [
        {
          context: ".",
        },
      ],
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
