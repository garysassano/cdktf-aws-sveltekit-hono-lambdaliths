import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here...
  }
}

const app = new App();

new MyStack(app, "cdktf-project-dev");
// new MyStack(app, 'cdktf-project-prod');

app.synth();
