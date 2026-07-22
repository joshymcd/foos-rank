/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "foosball-tracker",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
    };
  },
  async run() {
    const webapp = new sst.aws.TanStackStart("MyWeb", {
      path: "apps/web/",
    });

    return {
      webapp,
    };
  },
});
