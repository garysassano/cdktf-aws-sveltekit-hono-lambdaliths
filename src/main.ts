import path from "path";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { DataAwsEcrAuthorizationToken } from "../.gen/providers/aws/data-aws-ecr-authorization-token";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
import { EcsCluster } from "../.gen/providers/aws/ecs-cluster";
import { EcsService } from "../.gen/providers/aws/ecs-service";
import { EcsTaskDefinition } from "../.gen/providers/aws/ecs-task-definition";
import { IamPolicy } from "../.gen/providers/aws/iam-policy";
import { IamRole } from "../.gen/providers/aws/iam-role";
import { IamRolePolicyAttachment } from "../.gen/providers/aws/iam-role-policy-attachment";
import { AwsProvider } from "../.gen/providers/aws/provider";
import { Image } from "../.gen/providers/docker/image";
import { DockerProvider } from "../.gen/providers/docker/provider";
import { RegistryImage } from "../.gen/providers/docker/registry-image";

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS provider
    new AwsProvider(this, "aws");

    // Get ECR authorization token
    const token = new DataAwsEcrAuthorizationToken(this, "token");

    // Configure Docker provider
    new DockerProvider(this, "docker", {
      registryAuth: [
        {
          address: token.proxyEndpoint,
          password: token.password,
          username: token.userName,
        },
      ],
    });

    // Create ECR repos
    const backRepo = new EcrRepository(this, "BackRepo", {
      name: "back-repo",
    });
    const frontRepo = new EcrRepository(this, "FrontRepo", {
      name: "front-repo",
    });

    // Build Docker images
    const backImage = new Image(this, "BackImage", {
      buildAttribute: { context: path.join(__dirname, "back") },
      name: backRepo.repositoryUrl,
      platform: "linux/arm64",
    });
    const frontImage = new Image(this, "FrontImage", {
      buildAttribute: { context: path.join(__dirname, "front") },
      name: frontRepo.repositoryUrl,
      platform: "linux/arm64",
    });

    // Upload Docker images to ECR
    new RegistryImage(this, "BackUpload", {
      name: backImage.name,
    });
    new RegistryImage(this, "FrontUpload", {
      name: frontImage.name,
    });
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");

app.synth();
