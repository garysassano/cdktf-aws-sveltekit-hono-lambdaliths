# cdktf-aws-sveltekit-hono-lambdaliths

CDKTF app that deploys SvelteKit and Hono Lambdaliths along with an Upstash Redis database to AWS.

This app leverages the [AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter) with Lambda Function URLs.

## Prerequisites

- **_AWS:_**
  - Must have authenticated with [Default Credentials](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication-and-configuration) in your local environment.
- **_Upstash:_**
  - Must have set the `UPSTASH_EMAIL` and `UPSTASH_API_KEY` variables in your local environment.
- **_Terraform:_**
  - Must be [installed](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli#install-terraform) in your system.
- **_Node.js + npm:_**
  - Must be [installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) in your system.
- **_Docker:_**
  - Must be [installed](https://docs.docker.com/get-docker/) in your system and running at deployment.

## Installation

```sh
npx projen install
```

## Deployment

```sh
npx projen deploy
```

## Cleanup

```sh
npx projen destroy
```

## Application Details

- `back-lambda`
  - Environment variables:
    - `REDIS_URL` - Address of the Redis database in the form of `rediss://<user>:<psw>@<host>:<port>`
  - Port bindings:
    - `3000`
  - Endpoints:
    - `/` - Hello message display
    - `/ping` - Returns static "pong" response (used for readyness check)
    - `/api/clicks` - Returns current click count
    - `/api/clicks/incr` - Increments click count by 1 and returns new click count
- `front-lambda`
  - Environment variables:
    - `BACKEND_URL` - Address of the backend service reachable from the server side in the form of `https://<host>`
  - Port bindings:
    - `3000`
  - Endpoints:
    - `/`  - Click counter display
    - `/ping` - Returns static "pong" response (used for readyness check)

## Architecture Diagram

![Architecture Diagram](./src/assets/arch-diagram.svg)
