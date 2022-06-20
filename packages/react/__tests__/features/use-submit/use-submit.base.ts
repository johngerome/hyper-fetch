import { startServer, resetInterceptors, stopServer } from "../../server";

describe("useSubmit [ Base ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  describe("when submit method gets triggered", () => {
    it("should trigger request", async () => {
      // Todo
    });
    it("should allow to trigger all event methods", async () => {
      // Todo
    });
    it("should allow to trigger all event methods on dynamic keys change", async () => {
      // Todo
    });
    it("should isolate helper hooks between different calls", async () => {
      // Todo
    });
    it("should call helper hooks for every request made", async () => {
      // Todo
    });
  });
});
