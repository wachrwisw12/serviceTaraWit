self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients
      .matchAll({ type: "window" })
      .then((clients) =>
        Promise.all(
          clients.map((client) =>
            "navigate" in client ? client.navigate(client.url) : undefined,
          ),
        ),
      ),
  );
});
