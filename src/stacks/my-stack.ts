import { Fn, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { join } from "path";
import { DataAwsEcrAuthorizationToken } from "../../.gen/providers/aws/data-aws-ecr-authorization-token";
import { EcrRepository } from "../../.gen/providers/aws/ecr-repository";
import { IamRole } from "../../.gen/providers/aws/iam-role";
import { IamRolePolicyAttachment } from "../../.gen/providers/aws/iam-role-policy-attachment";
import { LambdaFunction } from "../../.gen/providers/aws/lambda-function";
import { LambdaFunctionUrl } from "../../.gen/providers/aws/lambda-function-url";
import { AwsProvider } from "../../.gen/providers/aws/provider";
import { Image } from "../../.gen/providers/docker/image";
import { DockerProvider } from "../../.gen/providers/docker/provider";
import { RegistryImage } from "../../.gen/providers/docker/registry-image";
import { UpstashProvider } from "../../.gen/providers/upstash/provider";
import { RedisDatabase } from "../../.gen/providers/upstash/redis-database";
import { validateEnv } from "../utils/validate-env";

const env = validateEnv(["UPSTASH_EMAIL", "UPSTASH_API_KEY"]);

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure Upstash provider
    new UpstashProvider(this, "UpstashProvider", {
      email: env.UPSTASH_EMAIL,
      apiKey: env.UPSTASH_API_KEY,
    });

    // Create an Upstash Redis database
    const redisDatabase = new RedisDatabase(this, "RedisDatabase", {
      databaseName: "redis-database",
      region: "global",
      primaryRegion: "eu-central-1",
      tls: true,
    });

    // Configure AWS provider
    new AwsProvider(this, "AwsProvider", {
      region: "eu-central-1",
    });

    // Get ECR authorization token
    const token = new DataAwsEcrAuthorizationToken(this, "EcrToken");

    // Configure Docker provider
    new DockerProvider(this, "DockerProvider", {
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

    // Calculate SHA256 digests for Dockerfiles
    const backDockerfileDigest = Fn.filesha256(
      join(__dirname, "..", "functions/back", "Dockerfile"),
    );
    const frontDockerfileDigest = Fn.filesha256(
      join(__dirname, "..", "functions/front", "Dockerfile"),
    );

    // Build Docker images
    const backImage = new Image(this, "BackImage", {
      buildAttribute: {
        context: join(__dirname, "..", "functions/back"),
        platform: "linux/arm64",
      },
      name: backRepo.repositoryUrl,
      triggers: { filesha256: backDockerfileDigest },
    });
    const frontImage = new Image(this, "FrontImage", {
      buildAttribute: {
        context: join(__dirname, "..", "functions/front"),
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

    // Back Lambda function URL (Hono)
    const backLambda = new LambdaFunction(this, "BackLambda", {
      functionName: "back-lambda",
      role: lambdaRole.arn,
      packageType: "Image",
      imageUri: `${backEcrImage.name}@${backEcrImage.sha256Digest}`,
      architectures: ["arm64"],
      memorySize: 1769,
      timeout: 5,
      loggingConfig: { logFormat: "JSON" },
      environment: {
        variables: {
          REDIS_URL: `rediss://default:${redisDatabase.password}@${redisDatabase.endpoint}:${redisDatabase.port}`,
        },
      },
    });
    const backLambdaUrl = new LambdaFunctionUrl(this, "BackLambdaUrl", {
      functionName: backLambda.functionName,
      authorizationType: "NONE",
    });

    // Front Lambda function URL (SvelteKit)
    const frontLambda = new LambdaFunction(this, "FrontLambda", {
      functionName: "front-lambda",
      role: lambdaRole.arn,
      packageType: "Image",
      imageUri: `${frontEcrImage.name}@${frontEcrImage.sha256Digest}`,
      architectures: ["arm64"],
      memorySize: 1769,
      timeout: 5,
      loggingConfig: { logFormat: "JSON" },
      environment: {
        variables: {
          BACKEND_URL: Fn.trimsuffix(backLambdaUrl.functionUrl, "/"),
        },
      },
    });
    const frontLambdaUrl = new LambdaFunctionUrl(this, "FrontLambdaUrl", {
      functionName: frontLambda.functionName,
      authorizationType: "NONE",
    });

    // Terraform outputs
    new TerraformOutput(this, "FrontLambdaURL", {
      value: frontLambdaUrl.functionUrl,
    });
    new TerraformOutput(this, "BackLambdaURL", {
      value: backLambdaUrl.functionUrl,
    });
  }
}
