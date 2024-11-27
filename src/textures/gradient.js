export function createGradient(scene, key, width, height, color1, color2) {
  const texture = scene.textures.createCanvas(key, width, height);
  const context = texture.getContext();

  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height)
  );
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  texture.refresh();
}
