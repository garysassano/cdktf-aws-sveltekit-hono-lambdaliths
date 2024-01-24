import path from "path";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { DataAwsEcrAuthorizationToken } from "../.gen/providers/aws/data-aws-ecr-authorization-token";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
// import { LambdaPermission } from "../.gen/providers/aws/lambda-permission";
import { IamRole } from "../.gen/providers/aws/iam-role";
import { LambdaFunction } from "../.gen/providers/aws/lambda-function";
// import { DataAwsIamPolicyDocument } from "../.gen/providers/aws/data-aws-iam-policy-document";
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
      name: `${backRepo.repositoryUrl}:latest`,
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

    // IAM Role for Lambda
    const lambdaExecRole = new IamRole(this, "LambdaExecRole", {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });

    // Lambda function
    new LambdaFunction(this, "BackLambda", {
      functionName: "back-lambda",
      role: lambdaExecRole.arn,
      packageType: "Image",
      imageUri: backImage.name,
      architectures: ["arm64"],
      memorySize: 1792,
      timeout: 5,
      loggingConfig: { logFormat: "JSON" },
    });

    // const policy = new DataAwsIamPolicyDocument(this, "policy", {});

    // new IamRolePolicyAttachment(this, "LambdaRolePolicy", {
    //   role: lambdaRole.name,
    //   policyArn:
    //     "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    // });

    // (Optional) Lambda permission, if the function needs to be triggered by other AWS services
    // new LambdaPermission(this, "LambdaPermission", {
    //   action: "lambda:InvokeFunction",
    //   functionName: lambdaFunction.functionName,
    //   principal: "s3.amazonaws.com", // Example for S3
    //   // other configurations as required
    // });

    // ... (rest of your existing code)
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");

app.synth();
