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

    // Create OCI images
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

    // Upload OCI images to ECR
    new RegistryImage(this, "BackUpload", {
      name: backImage.name,
    });
    new RegistryImage(this, "FrontUpload", {
      name: frontImage.name,
    });

    const ecsCluster = new EcsCluster(this, "EcsCluster", {
      name: "ecs-cluster",
    });

    const ecsTaskExecutionRolePolicy = new IamPolicy(
      this,
      "ecsTaskExecutionRolePolicy",
      {
        name: "ecsTaskExecutionRolePolicy",
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              Resource: "*",
            },
          ],
        }),
      },
    );

    const ecsExecutionRole = new IamRole(this, "ecsExecutionRole", {
      name: "ecsExecutionRole",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "ecsExecutionRolePolicyAttachment", {
      role: ecsExecutionRole.name,
      policyArn: ecsTaskExecutionRolePolicy.arn,
    });

    const backTaskDefinition = new EcsTaskDefinition(this, "BackTaskDef", {
      executionRoleArn: ecsExecutionRole.arn,
      family: "back-task",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      containerDefinitions: JSON.stringify([
        {
          name: "back",
          image: backRepo.repositoryUrl,
          portMappings: [
            {
              containerPort: 4000,
              hostPort: 4000,
            },
          ],
          // environment: [
          //   { name: "REDIS_SERVER", value: "your-redis-server-address" },
          // ],
        },
      ]),
    });

    new EcsService(this, "BackService", {
      name: "back-service",
      cluster: ecsCluster.id,
      taskDefinition: backTaskDefinition.arn,
      launchType: "FARGATE",
      // networkConfiguration: {
      //   // Define network configurations here
      // },
      desiredCount: 1,
    });
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");

app.synth();
