import path from "path";
import { App, TerraformStack, Fn } from "cdktf";
import { Construct } from "constructs";
import { DataAwsEcrAuthorizationToken } from "../.gen/providers/aws/data-aws-ecr-authorization-token";
// import { DataAwsIamPolicyDocument } from "../.gen/providers/aws/data-aws-iam-policy-document";
import { EcrRepository } from "../.gen/providers/aws/ecr-repository";
// import { LambdaPermission } from "../.gen/providers/aws/lambda-permission";
import { IamRole } from "../.gen/providers/aws/iam-role";
import { IamRolePolicyAttachment } from "../.gen/providers/aws/iam-role-policy-attachment";
import { LambdaFunction } from "../.gen/providers/aws/lambda-function";
import { LambdaFunctionUrl } from "../.gen/providers/aws/lambda-function-url";
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

    // Calculate the SHA256 digests for the Dockerfiles
    const backDockerfileDigest = Fn.filesha256(
      path.join(__dirname, "back/Dockerfile"),
    );
    const frontDockerfileDigest = Fn.filesha256(
      path.join(__dirname, "front/Dockerfile"),
    );

    // Build Docker images
    const backImage = new Image(this, "BackImage", {
      buildAttribute: {
        context: path.join(__dirname, "back"),
        platform: "linux/arm64",
      },
      name: backRepo.repositoryUrl,
      triggers: { filesha256: backDockerfileDigest },
    });
    const frontImage = new Image(this, "FrontImage", {
      buildAttribute: {
        context: path.join(__dirname, "front"),
        platform: "linux/arm64",
      },
      name: frontRepo.repositoryUrl,
      triggers: { filesha256: frontDockerfileDigest },
    });

    // Push Docker images to ECR
    const backEcrImage = new RegistryImage(this, "BackEcrImage", {
      name: backImage.name,
      triggers: { filesha256: backDockerfileDigest },
    });
    const frontEcrImage = new RegistryImage(this, "FrontEcrImage", {
      name: frontImage.name,
      triggers: { filesha256: frontDockerfileDigest },
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, "LambdaRole", {
      name: "lambda-role",
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

    // IAM Role Policy for Lambda
    new IamRolePolicyAttachment(this, "LambdaRolePolicyAttachment", {
      role: lambdaRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    // Back Lambda function
    const backLambda = new LambdaFunction(this, "BackLambda", {
      functionName: "back-lambda",
      role: lambdaRole.arn,
      packageType: "Image",
      imageUri: `${backEcrImage.name}@${backEcrImage.sha256Digest}`,
      architectures: ["arm64"],
      memorySize: 1792,
      timeout: 5,
      loggingConfig: { logFormat: "JSON" },
      environment: {
        variables: {
          HOME: "/tmp",
          REDIS_SERVER:
            "redis://default:01082a7f147849a7bf623acf830ca41d@eu2-learning-dane-32666.upstash.io:32666",
        },
      },
    });

    // Back Lambda function URL
    const backLambdaFunctionUrl = new LambdaFunctionUrl(this, "BackLambdaUrl", {
      functionName: backLambda.functionName,
      authorizationType: "NONE",
    });

    // Front Lambda function
    const frontLambda = new LambdaFunction(this, "FrontLambda", {
      functionName: "front-lambda",
      role: lambdaRole.arn,
      packageType: "Image",
      imageUri: `${frontEcrImage.name}@${frontEcrImage.sha256Digest}`,
      architectures: ["arm64"],
      memorySize: 1792,
      timeout: 5,
      loggingConfig: { logFormat: "JSON" },
      environment: {
        variables: {
          HOME: "/tmp",
          BACKEND_API_URL: backLambdaFunctionUrl.functionUrl,
          CLIENT_API_URL: backLambdaFunctionUrl.functionUrl,
        },
      },
    });

    // Front Lambda function URL
    new LambdaFunctionUrl(this, "FrontLambdaUrl", {
      functionName: frontLambda.functionName,
      authorizationType: "NONE",
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
