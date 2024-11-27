export function createMiniMap(scene, mainScene) {
  const miniMapFactor = 0.2;
  const width = mainScene.physics.world.bounds.width;
  const height = mainScene.physics.world.bounds.height;
  const miniMapWidth = width * miniMapFactor;
  const miniMapHeight = height * miniMapFactor;
  const positionX = scene.rexUI.viewport.right - miniMapWidth;
  const positionY = scene.rexUI.viewport.bottom - miniMapHeight
  const miniMapCamera = mainScene.cameras.add(
    positionX,
    positionY,
    miniMapWidth,
    miniMapHeight,
    false,
    "miniMap"
  );
  miniMapCamera.setZoom(miniMapFactor);
  miniMapCamera.setBounds(0, 0, width, height);

  return miniMapCamera;
}
