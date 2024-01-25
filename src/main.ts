import path from "path";
import { App, TerraformStack, Fn } from "cdktf";
import { Construct } from "constructs";
import { DataAwsEcrAuthorizationToken } from "../.gen/providers/aws/data-aws-ecr-authorization-token";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
// import { LambdaPermission } from "../.gen/providers/aws/lambda-permission";
// import { IamRole } from "../.gen/providers/aws/iam-role";
// import { IamRolePolicyAttachment } from "../.gen/providers/aws/iam-role-policy-attachment";
// import { LambdaFunction } from "../.gen/providers/aws/lambda-function";
// import { LambdaFunctionUrl } from "../.gen/providers/aws/lambda-function-url";
// import { DataAwsIamPolicyDocument } from "../.gen/providers/aws/data-aws-iam-policy-document";
import { AwsProvider } from "../.gen/providers/aws/provider";
import { Image } from "../.gen/providers/docker/image";
import { DockerProvider } from "../.gen/providers/docker/provider";
// import { RegistryImage } from "../.gen/providers/docker/registry-image";

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

    // Calculate the SHA256 digests for the Dockerfiles
    const backDockerfileDigest = Fn.filesha256(
      path.join(__dirname, "back/Dockerfile"),
    );
    const frontDockerfileDigest = Fn.filesha256(
      path.join(__dirname, "front/Dockerfile"),
    );

    // Build Docker images
    new Image(this, "BackImage", {
      buildAttribute: {
        context: path.join(__dirname, "back"),
        platform: "linux/amd64",
      },
      name: `${backRepo.repositoryUrl}:latest`,
      triggers: { filesha256: backDockerfileDigest },
    });
    new Image(this, "FrontImage", {
      buildAttribute: {
        context: path.join(__dirname, "front"),
        platform: "linux/amd64",
      },
      name: `${frontRepo.repositoryUrl}:latest`,
      triggers: { filesha256: frontDockerfileDigest },
    });

    // // Push Docker images to ECR
    // new RegistryImage(this, "BackPush", {
    //   name: backImage.name,
    //   triggers: { filesha256: backDockerfileDigest },
    // });
    // new RegistryImage(this, "FrontPush", {
    //   name: frontImage.name,
    //   triggers: { filesha256: frontDockerfileDigest },
    // });

    // // IAM Role for Lambda
    // const lambdaRole = new IamRole(this, "LambdaRole", {
    //   name: "lambda-role",
    //   assumeRolePolicy: JSON.stringify({
    //     Version: "2012-10-17",
    //     Statement: [
    //       {
    //         Effect: "Allow",
    //         Principal: {
    //           Service: "lambda.amazonaws.com",
    //         },
    //         Action: "sts:AssumeRole",
    //       },
    //     ],
    //   }),
    // });

    // new IamRolePolicyAttachment(this, "LambdaExecPolicyAttachment", {
    //   role: lambdaRole.name,
    //   policyArn:
    //     "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    // });

    // // Lambda function
    // const backLambda = new LambdaFunction(this, "BackLambda", {
    //   functionName: "back-lambda",
    //   role: lambdaRole.arn,
    //   packageType: "Image",
    //   imageUri: backImage.name,
    //   architectures: ["arm64"],
    //   memorySize: 1792,
    //   timeout: 5,
    //   loggingConfig: { logFormat: "JSON" },
    // });

    // new LambdaFunctionUrl(this, "BackLambdaUrl", {
    //   functionName: backLambda.functionName,
    //   authorizationType: "NONE",
    // });

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
