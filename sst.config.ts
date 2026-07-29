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
    const domain =
      $app.stage === "production"
        ? "foosball.joshmc.dev"
        : `${$app.stage}.foosball.joshmc.dev`;

    const webapp = new sst.aws.TanStackStart("MyWeb", {
      path: "apps/web/",
      domain,
    });

    return {
      webapp,
    };
  },
});
