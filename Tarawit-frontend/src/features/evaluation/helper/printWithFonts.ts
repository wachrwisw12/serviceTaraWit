export async function printEvaluationReport(): Promise<void> {
  if ("fonts" in document) {
    await document.fonts.load('16px "TH Sarabun New"');
    await document.fonts.load('700 16px "TH Sarabun New"');
    await document.fonts.ready;
  }

  const pendingImages = Array.from(document.images).filter(
    (image) => !image.complete,
  );
  await Promise.all(
    pendingImages.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );

  window.print();
}
