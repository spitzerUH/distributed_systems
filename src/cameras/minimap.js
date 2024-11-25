export function createMiniMap(scene) {
  const miniMapFactor = 0.2;
  const width = scene.physics.world.bounds.width;
  const height = scene.physics.world.bounds.height;
  const miniMapWidth = width * miniMapFactor;
  const miniMapHeight = height * miniMapFactor;

  const miniMapCamera = scene.cameras.add(
    width - miniMapWidth,
    height - miniMapHeight,
    width,
    height,
    false,
    "miniMap"
  );
  miniMapCamera.setZoom(miniMapFactor);
  miniMapCamera.setBounds(0, 0, width, height);

  return miniMapCamera;
}
