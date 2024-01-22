import { App } from "cdktf";
import { MyStack } from "./stacks/my-stack";

const app = new App();

new MyStack(app, "cdktf-aws-sveltekit-hono-lambdaliths-dev");

app.synth();
