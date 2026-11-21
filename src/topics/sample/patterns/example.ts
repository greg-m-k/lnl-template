// Sample topic · placeholder pattern. Replace it with one pattern's real code: the lesson shows this exact file.
export async function run(base: string) {
  const started = performance.now();
  const response = await fetch(`${base}/sample/api/hello`);
  return { status: response.status, ms: performance.now() - started };
}
