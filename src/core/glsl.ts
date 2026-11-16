const chunks = import.meta.glob<string>("../shaders/chunks/*.glsl", {
  query: "?raw",
  import: "default",
  eager: true,
});
export function glsl(source: string): string {
  const included = new Set<string>();
  return source.replace(/#include <([\w-]+)>/g, (_, name: string) => {
    const key = "../shaders/chunks/" + name + ".glsl";
    if (!chunks[key]) throw new Error("Unknown GLSL chunk " + name);
    if (included.has(name)) return "";
    included.add(name);
    return resolve(chunks[key], included);
  });
}
function resolve(source: string, seen: Set<string>): string {
  return source.replace(/#include <([\w-]+)>/g, (_, name: string) => {
    if (seen.has(name)) return "";
    seen.add(name);
    return resolve(chunks["../shaders/chunks/" + name + ".glsl"], seen);
  });
}
