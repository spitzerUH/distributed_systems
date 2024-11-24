export function initMainCamera(scene) {
  const mainCamera = scene.cameras.main;

  //mainCamera.setBounds(0, 0, mainCamera.width, mainCamera.height);
  mainCamera.setZoom(3);

  return mainCamera;
}
