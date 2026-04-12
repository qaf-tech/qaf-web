import { afterEach } from "bun:test";
import { plugin } from "bun";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

plugin({
  name: "css-modules-stub",
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, () => ({
      contents:
        "export default new Proxy({}, { get: (_t, p) => typeof p === 'string' ? p : '' });",
      loader: "js",
    }));
    build.onLoad({ filter: /\.css$/ }, () => ({
      contents: "export default {};",
      loader: "js",
    }));
  },
});

GlobalRegistrator.register();

afterEach(() => {
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
});
