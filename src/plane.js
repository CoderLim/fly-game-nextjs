import * as THREE from 'three';

export function createPlane() {
  // 创建飞机组
  const planeGroup = new THREE.Group();
  
  // 机身材质
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x3333ff,
    flatShading: true
  });
  
  // 创建机身
  const bodyGeometry = new THREE.BoxGeometry(5, 4, 20);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  planeGroup.add(body);
  
  // 创建机翼
  const wingGeometry = new THREE.BoxGeometry(30, 1, 10);
  const wing = new THREE.Mesh(wingGeometry, bodyMaterial);
  wing.position.y = 2;
  wing.castShadow = true;
  wing.receiveShadow = true;
  planeGroup.add(wing);
  
  // 创建尾翼
  const tailGeometry = new THREE.BoxGeometry(10, 3, 3);
  const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
  tail.position.z = 10;
  tail.position.y = 4;
  tail.castShadow = true;
  tail.receiveShadow = true;
  planeGroup.add(tail);
  
  // 创建垂直尾翼
  const verticalTailGeometry = new THREE.BoxGeometry(1, 6, 4);
  const verticalTail = new THREE.Mesh(verticalTailGeometry, bodyMaterial);
  verticalTail.position.z = 10;
  verticalTail.position.y = 7;
  verticalTail.castShadow = true;
  verticalTail.receiveShadow = true;
  planeGroup.add(verticalTail);
  
  // 创建螺旋桨
  const propellerGroup = new THREE.Group();
  propellerGroup.position.z = -10;
  
  const hubGeometry = new THREE.SphereGeometry(1, 16, 16);
  const hubMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  hub.castShadow = true;
  propellerGroup.add(hub);
  
  const bladeGeometry = new THREE.BoxGeometry(1, 10, 0.5);
  const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
  
  // 创建两个螺旋桨叶片
  const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade1.castShadow = true;
  propellerGroup.add(blade1);
  
  const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade2.rotation.x = Math.PI / 2;
  blade2.castShadow = true;
  propellerGroup.add(blade2);
  
  planeGroup.add(propellerGroup);
  
  // 创建驾驶舱
  const cockpitGeometry = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cockpitMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.7
  });
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
  cockpit.position.set(0, 4, -5);
  cockpit.rotation.x = Math.PI;
  cockpit.castShadow = true;
  planeGroup.add(cockpit);
  
  // 设置飞机的初始位置
  planeGroup.position.y = 50;
  
  // 对飞机进行缩放
  planeGroup.scale.set(1.0, 1.0, 1.0);
  
  return {
    plane: planeGroup,
    propeller: propellerGroup
  };
} 