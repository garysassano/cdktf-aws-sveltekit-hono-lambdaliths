import { Testing } from "cdktf";
import { MyStack } from "../src/main";

test("Snapshot", () => {
  const template = Testing.synthScope((scope) => {
    new MyStack(scope, "test");
  });
  expect(template).toMatchSnapshot();
});
