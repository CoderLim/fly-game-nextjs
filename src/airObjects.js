import * as THREE from 'three';

// 存储所有空中物体的集合
const airObjects = new THREE.Group();
const loadedAirChunks = new Map();
const AIR_CHUNK_SIZE = 1000; // 空中区块大小
const AIR_OBJECTS_PER_CHUNK = 3; // 降低空中物体的数量，更符合现实

// 天气系统
const weatherSystem = {
  // 获取当前天气 - 简单实现，可以扩展为从API获取真实天气数据
  getCurrentWeather: function() {
    // 预设天气类型：晴天、多云、有风、雨天
    const weatherTypes = ['sunny', 'cloudy', 'windy', 'rainy'];
    
    // 这里可以添加基于时间的天气变化或随机天气
    // 使用日期的小时作为随机种子，使每小时天气保持一致
    const hour = new Date().getHours();
    const weatherIndex = Math.floor((Math.sin(hour) + 1) * 2) % weatherTypes.length;
    
    return weatherTypes[weatherIndex];
  },
  
  // 根据天气调整空中物体的生成规则
  getGenerationRules: function() {
    const weather = this.getCurrentWeather();
    
    // 默认规则
    const rules = {
      balloonChance: 0.3,    // 热气球出现概率
      blimpChance: 0.25,     // 飞艇出现概率
      droneChance: 0.25,     // 无人机出现概率
      ufoChance: 0.2,        // UFO出现概率
      heightRanges: {        // 高度范围（米）
        balloon: { min: 100, max: 300 },
        blimp: { min: 200, max: 500 },
        drone: { min: 50, max: 150 },
        ufo: { min: 300, max: 800 }
      },
      speedFactor: 1.0,      // 速度系数
      movementDirection: { x: 0, z: -1 }  // 默认向北移动
    };
    
    // 根据天气调整规则
    switch (weather) {
      case 'sunny':
        // 晴天适合所有飞行器
        rules.balloonChance = 0.4;     // 更多热气球
        rules.ufoChance = 0.25;        // 晴天UFO更多
        rules.speedFactor = 1.0;
        break;
        
      case 'cloudy':
        // 多云天气减少热气球，增加飞艇
        rules.balloonChance = 0.2;
        rules.blimpChance = 0.4;
        rules.ufoChance = 0.3;         // 多云天气UFO出现更多
        rules.heightRanges.balloon.max = 200; // 热气球飞得更低
        rules.speedFactor = 0.8;      // 整体速度较慢
        break;
        
      case 'windy':
        // 有风天气减少无人机，热气球飞得更低
        rules.droneChance = 0.1;
        rules.ufoChance = 0.15;        // 风大时UFO减少
        rules.heightRanges.balloon.min = 80;
        rules.heightRanges.balloon.max = 150;
        rules.speedFactor = 1.5;      // 整体速度较快
        // 风向随机，但保持一致性
        const windAngle = Math.sin(new Date().getHours()) * Math.PI;
        rules.movementDirection = {
          x: Math.sin(windAngle),
          z: Math.cos(windAngle)
        };
        break;
        
      case 'rainy':
        // 雨天减少所有飞行器，尤其是热气球
        rules.balloonChance = 0.1;
        rules.blimpChance = 0.2;
        rules.droneChance = 0.2;
        rules.ufoChance = 0.1;         // 雨天UFO很少
        rules.heightRanges.balloon.max = 120; // 热气球飞得更低
        rules.heightRanges.blimp.max = 350;   // 飞艇也降低高度
        rules.speedFactor = 0.6;      // 整体速度很慢
        break;
    }
    
    rules.weather = weather; // 保存当前天气供后续使用
    return rules;
  }
};

// 创建热气球
function createHotAirBalloon() {
  const group = new THREE.Group();
  
  // 气球部分
  const balloonGeometry = new THREE.SphereGeometry(15, 16, 16);
  // 随机选择气球颜色，但使用更加现实的颜色
  const colors = [
    0xff4444, // 红色
    0xffaa44, // 橙色
    0xffff44, // 黄色
    0x44ff44, // 绿色
    0x4444ff, // 蓝色
    0xff44ff, // 粉色
    0x44ffff  // 青色
  ];
  
  // 选择一种主色
  const mainColor = colors[Math.floor(Math.random() * colors.length)];
  const balloonMaterial = new THREE.MeshPhongMaterial({
    color: mainColor,
    flatShading: false
  });
  const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
  balloon.position.y = 20;
  balloon.castShadow = true;
  group.add(balloon);
  
  // 添加条纹装饰 - 更具现实感
  if (Math.random() > 0.5) {
    // 选择一种对比色作为条纹
    const stripeColor = colors[(Math.floor(Math.random() * colors.length) + 3) % colors.length];
    const stripeCount = Math.floor(Math.random() * 8) + 4; // 4-12条条纹
    
    for (let i = 0; i < stripeCount; i++) {
      const angle = (i / stripeCount) * Math.PI;
      const stripeGeometry = new THREE.TorusGeometry(15, 0.5, 8, 32, Math.PI * 0.2);
      const stripeMaterial = new THREE.MeshPhongMaterial({
        color: stripeColor,
        flatShading: false
      });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.rotation.x = Math.PI / 2;
      stripe.rotation.y = angle;
      stripe.position.y = 20;
      group.add(stripe);
    }
  }
  
  // 顶部
  const topGeometry = new THREE.ConeGeometry(5, 5, 16);
  const topMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    flatShading: true
  });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.y = 35;
  top.castShadow = true;
  group.add(top);
  
  // 底部的篮子
  const basketGeometry = new THREE.BoxGeometry(10, 8, 10);
  const basketMaterial = new THREE.MeshPhongMaterial({
    color: 0x8B4513,
    flatShading: true
  });
  const basket = new THREE.Mesh(basketGeometry, basketMaterial);
  basket.position.y = 0;
  basket.castShadow = true;
  group.add(basket);
  
  // 连接气球和篮子的绳索
  const ropeCount = 4;
  for (let i = 0; i < ropeCount; i++) {
    const ropeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20);
    const ropeMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      flatShading: true
    });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.y = 10;
    
    // 根据索引放置绳索
    const angle = (i / ropeCount) * Math.PI * 2;
    rope.position.x = Math.sin(angle) * 8;
    rope.position.z = Math.cos(angle) * 8;
    rope.rotation.x = Math.PI / 12; // 稍微倾斜
    
    group.add(rope);
  }
  
  // 添加热气球特有的属性
  group.userData.type = 'balloon';
  
  return group;
}

// 创建小型飞艇
function createBlimp() {
  const group = new THREE.Group();
  
  // 飞艇主体
  const bodyGeometry = new THREE.CapsuleGeometry(8, 25, 16, 8);
  
  // 考虑更现实的飞艇颜色和标志
  const bodyColors = [
    0xdddddd, // 白色
    0xaaaaaa, // 浅灰色
    0x8888ff, // 浅蓝色
    0xff8888  // 浅红色
  ];
  const bodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];
  
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: bodyColor,
    flatShading: false
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  group.add(body);
  
  // 添加商业标志或条纹装饰
  if (Math.random() > 0.3) {
    const logoGeometry = new THREE.PlaneGeometry(10, 5);
    const logoMaterial = new THREE.MeshPhongMaterial({
      color: Math.random() > 0.5 ? 0xff0000 : 0x0000ff,
      flatShading: false,
      side: THREE.DoubleSide
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 3, 8.1);
    logo.rotation.y = Math.PI / 2;
    group.add(logo);
  } else {
    // 添加条纹装饰
    const stripeGeometry = new THREE.CapsuleGeometry(8.1, 5, 16, 8);
    const stripeColors = [0xff0000, 0x0000ff, 0xffaa00];
    const stripeColor = stripeColors[Math.floor(Math.random() * stripeColors.length)];
    const stripeMaterial = new THREE.MeshPhongMaterial({
      color: stripeColor,
      flatShading: false
    });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.z = Math.PI / 2;
    stripe.position.x = 10;
    group.add(stripe);
  }
  
  // 底部的座舱
  const cabinGeometry = new THREE.BoxGeometry(5, 3, 10);
  const cabinMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    flatShading: true
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = -8;
  cabin.castShadow = true;
  group.add(cabin);
  
  // 尾翼
  const tailGeometry = new THREE.BoxGeometry(10, 1, 5);
  const tailMaterial = new THREE.MeshPhongMaterial({
    color: 0x555555,
    flatShading: true
  });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.x = -15;
  tail.castShadow = true;
  group.add(tail);
  
  // 添加垂直尾翼
  const vTailGeometry = new THREE.BoxGeometry(5, 5, 1);
  const vTail = new THREE.Mesh(vTailGeometry, tailMaterial);
  vTail.position.set(-15, 2, 0);
  group.add(vTail);
  
  // 螺旋桨
  const propellerGroup = new THREE.Group();
  propellerGroup.position.x = 20;
  
  const hubGeometry = new THREE.SphereGeometry(1, 8, 8);
  const hubMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  propellerGroup.add(hub);
  
  const bladeGeometry = new THREE.BoxGeometry(0.5, 7, 1);
  const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
  
  const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade1.castShadow = true;
  propellerGroup.add(blade1);
  
  const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade2.rotation.z = Math.PI / 2;
  blade2.castShadow = true;
  propellerGroup.add(blade2);
  
  group.add(propellerGroup);
  
  // 存储螺旋桨引用，以便动画
  group.userData.propeller = propellerGroup;
  
  // 添加飞艇特有的属性
  group.userData.type = 'blimp';
  
  return group;
}

// 创建小型无人机
function createDrone() {
  const group = new THREE.Group();
  
  // 无人机主体
  const bodyGeometry = new THREE.BoxGeometry(5, 2, 5);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    flatShading: true
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  group.add(body);
  
  // 随机添加相机或其他设备
  if (Math.random() > 0.5) {
    const cameraGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
    const cameraMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      flatShading: true
    });
    const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.rotation.x = Math.PI / 2;
    camera.position.y = -1.5;
    group.add(camera);
    
    // 相机镜头
    const lensGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
    const lensMaterial = new THREE.MeshPhongMaterial({
      color: 0x3399ff,
      flatShading: false,
      transparent: true,
      opacity: 0.7
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.y = -2.2;
    lens.rotation.x = Math.PI / 2;
    group.add(lens);
  }
  
  // 添加指示灯
  const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const greenLightMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x004400,
    flatShading: false
  });
  const redLightMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    emissive: 0x440000,
    flatShading: false
  });
  
  // 前灯 - 绿色
  const frontLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
  frontLight.position.set(2, 0.5, 2);
  group.add(frontLight);
  
  // 后灯 - 红色
  const backLight = new THREE.Mesh(lightGeometry, redLightMaterial);
  backLight.position.set(-2, 0.5, -2);
  group.add(backLight);
  
  // 添加4个旋翼
  const armLength = 5;
  const armPositions = [
    { x: armLength, z: armLength },
    { x: -armLength, z: armLength },
    { x: -armLength, z: -armLength },
    { x: armLength, z: -armLength },
  ];
  
  for (let i = 0; i < armPositions.length; i++) {
    // 支臂
    const armGeometry = new THREE.BoxGeometry(armLength, 0.5, 0.5);
    const armMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      flatShading: true
    });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.x = armPositions[i].x / 2;
    arm.position.z = armPositions[i].z / 2;
    
    // 旋转支臂使其指向正确方向
    if (armPositions[i].x * armPositions[i].z > 0) {
      arm.rotation.y = Math.PI / 4;
    } else {
      arm.rotation.y = -Math.PI / 4;
    }
    
    arm.castShadow = true;
    group.add(arm);
    
    // 旋翼
    const propellerGroup = new THREE.Group();
    propellerGroup.position.set(armPositions[i].x, 0.5, armPositions[i].z);
    
    const hubGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8);
    const hubMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    propellerGroup.add(hub);
    
    const bladeGeometry = new THREE.BoxGeometry(4, 0.1, 0.5);
    const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
    
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.castShadow = true;
    propellerGroup.add(blade1);
    
    const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.rotation.y = Math.PI / 2;
    blade2.castShadow = true;
    propellerGroup.add(blade2);
    
    // 存储螺旋桨引用，以便动画
    propellerGroup.userData.rotation = i % 2 === 0 ? 0.3 : -0.3; // 相邻旋翼旋转方向相反
    group.add(propellerGroup);
    
    if (!group.userData.propellers) {
      group.userData.propellers = [];
    }
    group.userData.propellers.push(propellerGroup);
  }
  
  // 添加无人机特有的属性
  group.userData.type = 'drone';
  
  return group;
}

// 创建UFO
function createUFO() {
  const group = new THREE.Group();
  
  // UFO主体 - 飞碟形状
  const bodyGeometry = new THREE.SphereGeometry(15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    flatShading: false,
    metalness: 0.8,
    roughness: 0.2
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0;
  body.scale.y = 0.3; // 压扁成飞碟形状
  body.castShadow = true;
  group.add(body);
  
  // 底部圆形舱
  const bottomGeometry = new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bottomMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5
  });
  const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottom.position.y = -2;
  bottom.scale.y = 0.5;
  bottom.castShadow = true;
  group.add(bottom);
  
  // 舱内发光 - 随机颜色
  const glowColors = [0x00ff00, 0xff00ff, 0x00ffff, 0xffff00];
  const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
  const glowGeometry = new THREE.SphereGeometry(7.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 4);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.7
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = -3;
  glow.scale.y = 0.3;
  group.add(glow);
  
  // 添加光照效果 - 从底部发出的光
  const light = new THREE.PointLight(glowColor, 2, 100);
  light.position.y = -5;
  group.add(light);
  
  // 顶部圆顶 - 透明舱
  const domeGeometry = new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.7
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.position.y = 4;
  dome.castShadow = false;
  group.add(dome);
  
  // 围绕主体的环
  const ringGeometry = new THREE.TorusGeometry(18, 2, 16, 50);
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888,
    flatShading: false,
    metalness: 0.7
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0;
  ring.castShadow = true;
  group.add(ring);
  
  // 添加闪烁的灯
  const lightCount = 8;
  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;
    const lightGeometry = new THREE.SphereGeometry(1, 8, 8);
    
    // 交替的灯光颜色
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xff0000 : 0x0000ff
    });
    
    const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
    lightMesh.position.x = Math.sin(angle) * 18;
    lightMesh.position.z = Math.cos(angle) * 18;
    lightMesh.position.y = 0;
    
    // 添加闪烁动画数据
    lightMesh.userData.blinkOffset = Math.random() * Math.PI * 2; // 随机闪烁频率
    lightMesh.userData.blinkSpeed = 0.05 + Math.random() * 0.05;
    
    group.add(lightMesh);
  }
  
  // 添加UFO特有的属性
  group.userData.type = 'ufo';
  group.userData.rotationSpeed = 0.01 + Math.random() * 0.02; // 随机旋转速度
  group.userData.hoverAmplitude = 0.5 + Math.random() * 1.0;  // 随机悬浮幅度
  group.userData.hoverOffset = Math.random() * Math.PI * 2;    // 随机悬浮偏移
  group.userData.hoverSpeed = 0.01 + Math.random() * 0.02;     // 随机悬浮速度
  
  return group;
}

// 创建德国齐柏林飞艇
function createZeppelin() {
  const group = new THREE.Group();
  
  // 随机选择文字
  const texts = ["Hello World", "Made In China", "Fly High", "Sky Explorer", "Cloud Rider"];
  const selectedText = texts[Math.floor(Math.random() * texts.length)];
  
  // 创建飞艇主体 - 更大的椭圆形
  const bodyGeometry = new THREE.CapsuleGeometry(20, 100, 64, 64); // 使用更高的细分
  
  // 1. 首先创建基础材质
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd,
    flatShading: false,
    metalness: 0.5,
    shininess: 100,
  });
  
  // 创建飞艇基础网格
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  group.add(body);
  
  // 2. 为文字创建单独的几何体，贴合在飞艇表面
  // 创建两个文字贴片，一个在飞艇的每一侧
  const createTextDecal = (side) => {
    // 创建文字纹理
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 256;
    
    // 透明背景
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置文字样式
    context.font = 'Bold 90px Arial'; // 字体大小减小为原来的一半
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#E40000'; // 鲜红色文字
    context.fillText(selectedText, canvas.width / 2, canvas.height / 2);
    
    // 创建贴花纹理
    const textTexture = new THREE.CanvasTexture(canvas);
    
    // 创建贴花材质
    const decalMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      side: THREE.FrontSide
    });
    
    // 贴花位置
    const position = new THREE.Vector3(0, 0, side * 20.2); // 略微位于表面之上
    
    // 贴花方向 - 根据侧面调整
    const direction = new THREE.Vector3(0, 0, side);
    
    // 贴花尺寸，使其覆盖飞艇中部的合适区域
    const size = new THREE.Vector3(90, 25, 1);
    
    // 创建用于投影的矩阵
    const orientation = new THREE.Euler();
    const decalGeometry = new THREE.PlaneGeometry(1, 1);
    
    // 调整贴花的位置和朝向
    decalGeometry.lookAt(direction);
    decalGeometry.translate(position.x, position.y, position.z);
    
    // 创建文字贴花网格
    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    decalMesh.scale.set(size.x, size.y, size.z);
    
    // 使贴花稍微弯曲以适应飞艇表面
    // 在这里我们使用修改了的圆柱形几何体
    const curve = side * 0.05; // 调整曲率
    for (let i = 0; i < decalGeometry.attributes.position.count; i++) {
      const x = decalGeometry.attributes.position.getX(i);
      const z = decalGeometry.attributes.position.getZ(i);
      // 应用轻微的弯曲
      decalGeometry.attributes.position.setX(i, x * (1 + curve * z));
    }
    decalGeometry.attributes.position.needsUpdate = true;
    
    return decalMesh;
  };
  
  // 添加两侧的文字贴花
  const textLeft = createTextDecal(1);  // 左侧文字
  const textRight = createTextDecal(-1); // 右侧文字
  
  group.add(textLeft);
  group.add(textRight);
  
  // 底部的乘客舱
  const cabinGeometry = new THREE.BoxGeometry(40, 8, 10);
  const cabinMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    flatShading: true
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = -20;
  cabin.castShadow = true;
  group.add(cabin);
  
  // 添加窗户到乘客舱
  const windowCount = 8;
  const windowGeometry = new THREE.PlaneGeometry(2, 3);
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffcc,
    emissive: 0x888866,
    side: THREE.DoubleSide
  });
  
  for (let i = 0; i < windowCount; i++) {
    // 左侧窗户
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-19.5, -20, -5 + i * 10 / (windowCount - 1));
    leftWindow.rotation.y = Math.PI / 2;
    group.add(leftWindow);
    
    // 右侧窗户
    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(-19.5, -20, 5 - i * 10 / (windowCount - 1));
    rightWindow.rotation.y = Math.PI / 2;
    group.add(rightWindow);
  }
  
  // 添加4个引擎舱
  const engineCount = 4;
  const engineSpacing = 30; // 引擎之间的距离
  
  for (let i = 0; i < engineCount; i++) {
    const enginePosition = -45 + i * engineSpacing;
    
    // 引擎舱
    const engineHousingGeometry = new THREE.CylinderGeometry(3, 3, 8, 8);
    const engineHousingMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444
    });
    const engineHousing = new THREE.Mesh(engineHousingGeometry, engineHousingMaterial);
    engineHousing.rotation.x = Math.PI / 2;
    engineHousing.position.set(enginePosition, -25, 0);
    group.add(engineHousing);
    
    // 螺旋桨
    const propellerGroup = new THREE.Group();
    propellerGroup.position.set(enginePosition - 5, -25, 0);
    
    const hubGeometry = new THREE.SphereGeometry(1, 8, 8);
    const hubMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    propellerGroup.add(hub);
    
    const bladeGeometry = new THREE.BoxGeometry(0.5, 10, 1);
    const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
    
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.castShadow = true;
    propellerGroup.add(blade1);
    
    const blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.rotation.z = Math.PI / 2;
    blade2.castShadow = true;
    propellerGroup.add(blade2);
    
    group.add(propellerGroup);
    
    // 引擎支架
    const strutGeometry = new THREE.BoxGeometry(2, 10, 2);
    const strutMaterial = new THREE.MeshPhongMaterial({
      color: 0x555555
    });
    const strut = new THREE.Mesh(strutGeometry, strutMaterial);
    strut.position.set(enginePosition, -20, 0);
    group.add(strut);
    
    // 储存螺旋桨引用以便动画
    if (!group.userData.propellers) {
      group.userData.propellers = [];
    }
    group.userData.propellers.push(propellerGroup);
  }
  
  // 尾翼
  const tailFinGeometry = new THREE.BoxGeometry(15, 20, 2);
  const tailFinMaterial = new THREE.MeshPhongMaterial({
    color: 0xdddddd
  });
  const tailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
  tailFin.position.set(50, 5, 0);
  group.add(tailFin);
  
  // 添加飞艇特有属性
  group.userData.type = 'zeppelin';
  group.userData.rotationSpeed = 0.005; // 旋转速度很慢
  group.userData.hoverAmplitude = 0.3;  // 悬浮幅度很小
  group.userData.hoverOffset = Math.random() * Math.PI * 2;
  group.userData.hoverSpeed = 0.005;     // 悬浮速度很慢
  
  return group;
}

// 修改generateAirChunk函数的对象生成逻辑，加入UFO生成的可能性
function generateAirChunk(chunkX, chunkZ) {
  const chunkObjects = [];
  const rules = weatherSystem.getGenerationRules();
  
  // 创建随机数生成器，使用区块坐标作为种子，确保同一区块总是生成相同的对象
  const random = () => {
    // 简单的伪随机数生成，基于区块坐标
    let x = Math.sin(chunkX * 12.9898 + chunkZ * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // 根据区块位置确定这个区块中应该有多少个空中物体
  let count = Math.floor(random() * (AIR_OBJECTS_PER_CHUNK + 1));
  
  // 根据天气可能会减少对象数量
  if (rules.weather === 'rainy') {
    count = Math.max(1, Math.floor(count * 0.6)); // 雨天减少物体数量
  }
  
  for (let i = 0; i < count; i++) {
    // 确定这个物体的位置
    const offsetX = (random() - 0.5) * AIR_CHUNK_SIZE;
    const offsetZ = (random() - 0.5) * AIR_CHUNK_SIZE;
    
    const position = {
      x: chunkX * AIR_CHUNK_SIZE + offsetX,
      z: chunkZ * AIR_CHUNK_SIZE + offsetZ
    };
    
    // 根据各种物体的概率决定生成什么类型的物体
    const rand = random();
    let airObject;
    
    // 修改物体选择逻辑，加入UFO选择逻辑
    if (rand < rules.balloonChance) {  // 热气球
      airObject = createHotAirBalloon();
      position.y = rules.heightRanges.balloon.min + 
                   random() * (rules.heightRanges.balloon.max - rules.heightRanges.balloon.min);
      
      // 热气球移动特性
      airObject.userData.speed = (0.5 + random() * 1.0) * rules.speedFactor;
      airObject.userData.movementDirection = { 
        x: rules.movementDirection.x + (random() - 0.5) * 0.2,
        z: rules.movementDirection.z + (random() - 0.5) * 0.2
      };
    }
    else if (rand < rules.balloonChance + rules.blimpChance) {  // 飞艇
      airObject = createBlimp();
      position.y = rules.heightRanges.blimp.min + 
                   random() * (rules.heightRanges.blimp.max - rules.heightRanges.blimp.min);
      
      // 飞艇移动特性（比热气球快）
      airObject.userData.speed = (1.0 + random() * 1.5) * rules.speedFactor;
      airObject.userData.movementDirection = {
        x: rules.movementDirection.x + (random() - 0.5) * 0.1,
        z: rules.movementDirection.z + (random() - 0.5) * 0.1
      };
    }
    else if (rand < rules.balloonChance + rules.blimpChance + rules.droneChance) {  // 无人机
      airObject = createDrone();
      position.y = rules.heightRanges.drone.min + 
                   random() * (rules.heightRanges.drone.max - rules.heightRanges.drone.min);
      
      // 无人机移动特性（速度变化大，方向变化大）
      airObject.userData.speed = (1.0 + random() * 3.0) * rules.speedFactor;
      airObject.userData.movementDirection = {
        x: (random() - 0.5) * 2, // 无人机方向更随机
        z: (random() - 0.5) * 2
      };
      // 归一化方向向量
      const length = Math.sqrt(
        airObject.userData.movementDirection.x * airObject.userData.movementDirection.x +
        airObject.userData.movementDirection.z * airObject.userData.movementDirection.z
      );
      airObject.userData.movementDirection.x /= length;
      airObject.userData.movementDirection.z /= length;
    }
    else {  // UFO
      airObject = createUFO();
      position.y = rules.heightRanges.ufo.min + 
                   random() * (rules.heightRanges.ufo.max - rules.heightRanges.ufo.min);
      
      // UFO移动特性（速度快，方向变化剧烈，可能突然改变方向）
      airObject.userData.speed = (2.0 + random() * 4.0) * rules.speedFactor;
      airObject.userData.movementDirection = {
        x: (random() - 0.5) * 2,
        z: (random() - 0.5) * 2
      };
      // 归一化方向向量
      const length = Math.sqrt(
        airObject.userData.movementDirection.x * airObject.userData.movementDirection.x +
        airObject.userData.movementDirection.z * airObject.userData.movementDirection.z
      );
      airObject.userData.movementDirection.x /= length;
      airObject.userData.movementDirection.z /= length;
      
      // UFO特殊行为 - 随机方向变化时间
      airObject.userData.directionChangeTime = 10 + random() * 20; // 10-30秒后改变方向
      airObject.userData.timeUntilChange = airObject.userData.directionChangeTime;
    }
    
    // 设置位置并添加到区块对象中
    airObject.position.set(position.x, position.y, position.z);
    chunkObjects.push(airObject);
  }
  
  return chunkObjects;
}

// 初始化空中物体
export function createAirObjects() {
  // 初始加载中心区域的9个区块
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const chunkKey = `${x},${z}`;
      generateAirChunk(x, z);
      loadedAirChunks.set(chunkKey, true);
    }
  }
  
  return airObjects;
}

// 更新空中物体区块
export function updateAirObjectsChunks(playerPosition) {
  const currentChunkX = Math.floor(playerPosition.x / AIR_CHUNK_SIZE);
  const currentChunkZ = Math.floor(playerPosition.z / AIR_CHUNK_SIZE);
  
  // 检查周围的区块是否已加载
  for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
    for (let z = currentChunkZ - 1; z <= currentChunkZ + 1; z++) {
      const chunkKey = `${x},${z}`;
      if (!loadedAirChunks.has(chunkKey)) {
        generateAirChunk(x, z);
        loadedAirChunks.set(chunkKey, true);
      }
    }
  }
  
  // 在这里可以添加区块卸载逻辑，比如移除太远的物体以节省内存
  const removalDistance = AIR_CHUNK_SIZE * 3;
  airObjects.children.forEach(object => {
    const distance = Math.sqrt(
      Math.pow(object.position.x - playerPosition.x, 2) + 
      Math.pow(object.position.z - playerPosition.z, 2)
    );
    
    if (distance > removalDistance) {
      // 标记为待移除
      object.userData.shouldRemove = true;
    }
  });
  
  // 移除标记的物体
  for (let i = airObjects.children.length - 1; i >= 0; i--) {
    if (airObjects.children[i].userData.shouldRemove) {
      airObjects.remove(airObjects.children[i]);
    }
  }
  
  return airObjects;
}

// 获取当前天气状况，用于主界面显示
export function getCurrentWeather() {
  return weatherSystem.getCurrentWeather();
}

// 修改updateAirObjects函数以支持UFO的特殊行为
export function updateAirObjects(deltaTime) {
  // 遍历所有空中物体并更新它们的位置
  airObjects.children.forEach(object => {
    if (!object.userData.speed) return; // 跳过没有速度属性的对象
    
    // 一般移动逻辑
    const moveDist = object.userData.speed * deltaTime;
    object.position.x += object.userData.movementDirection.x * moveDist;
    object.position.z += object.userData.movementDirection.z * moveDist;
    
    // 对于UFO，添加特殊的行为
    if (object.userData.type === 'ufo') {
      // 旋转飞碟
      object.rotation.y += object.userData.rotationSpeed;
      
      // 上下悬浮动画
      object.position.y += Math.sin(
        performance.now() * 0.001 * object.userData.hoverSpeed + object.userData.hoverOffset
      ) * object.userData.hoverAmplitude * deltaTime;
      
      // 随机闪烁灯光
      object.children.forEach(child => {
        if (child.userData.blinkSpeed) {
          const blinkValue = (Math.sin(
            performance.now() * 0.001 * child.userData.blinkSpeed + child.userData.blinkOffset
          ) + 1) / 2;
          if (child.material) {
            child.material.opacity = 0.5 + blinkValue * 0.5;
          }
        }
      });
      
      // 随机方向变化
      object.userData.timeUntilChange -= deltaTime;
      if (object.userData.timeUntilChange <= 0) {
        // 重置计时器
        object.userData.timeUntilChange = object.userData.directionChangeTime;
        
        // 生成新的随机方向
        const angle = Math.random() * Math.PI * 2;
        object.userData.movementDirection = {
          x: Math.sin(angle),
          z: Math.cos(angle)
        };
        
        // 有小概率突然加速或减速
        if (Math.random() < 0.3) {
          object.userData.speed *= (Math.random() * 1.5) + 0.5; // 0.5x-2x速度变化
        }
      }
    }
    // 处理齐柏林飞艇
    else if (object.userData.type === 'zeppelin') {
      // 缓慢旋转
      object.rotation.y += object.userData.rotationSpeed * deltaTime;
      
      // 非常轻微的上下悬浮
      object.position.y += Math.sin(
        performance.now() * 0.001 * object.userData.hoverSpeed + object.userData.hoverOffset
      ) * object.userData.hoverAmplitude * deltaTime;
      
      // 旋转螺旋桨
      if (object.userData.propellers) {
        object.userData.propellers.forEach(propeller => {
          propeller.rotation.z += (0.5 + object.userData.speed * 0.1) * deltaTime * 5;
        });
      }
      
      // 缓慢改变方向
      object.userData.timeUntilChange -= deltaTime;
      if (object.userData.timeUntilChange <= 0) {
        // 重置计时器
        object.userData.timeUntilChange = object.userData.directionChangeTime;
        
        // 生成新的方向 - 但改变不会太剧烈
        const currentAngle = Math.atan2(
          object.userData.movementDirection.z,
          object.userData.movementDirection.x
        );
        // 最大偏航角为30度
        const angleChange = (Math.random() - 0.5) * Math.PI / 6;
        const newAngle = currentAngle + angleChange;
        
        object.userData.movementDirection = {
          x: Math.cos(newAngle),
          z: Math.sin(newAngle)
        };
        
        // 齐柏林飞艇速度不会有大变化
        object.userData.speed *= 0.9 + Math.random() * 0.2; // 0.9x-1.1x速度变化
      }
    }
    // 对于热气球，添加轻微的上下飘动
    else if (object.userData.type === 'balloon') {
      object.position.y += Math.sin(performance.now() * 0.0005) * 0.05;
    }
    
    // 对于无人机，添加不规则运动
    else if (object.userData.type === 'drone') {
      // 无人机倾斜，朝向移动方向
      const angle = Math.atan2(
        object.userData.movementDirection.x,
        object.userData.movementDirection.z
      );
      object.rotation.y = angle;
      
      // 随机小幅度高度变化
      if (Math.random() < 0.05) {
        object.position.y += (Math.random() - 0.5) * 2;
      }
    }
  });
  
  return airObjects;
}

// 在低空添加UFO
export function addLowAltitudeUFOs(count = 5) {
  // 设置不同高度范围的UFO
  const altitudeLevels = [
    { min: 30, max: 80, name: '低空', scale: 0.6, count: count },        // 低空
    { min: 150, max: 250, name: '中空', scale: 0.8, count: count - 2 },  // 中空
    { min: 400, max: 600, name: '高空', scale: 1.0, count: count - 3 }   // 高空
  ];
  
  // 在各个高度添加UFO
  altitudeLevels.forEach(level => {
    // 创建UFO并添加到场景中
    for (let i = 0; i < level.count; i++) {
      const ufo = createUFO();
      
      // 随机位置 - 在玩家周围的区域生成
      const offsetX = (Math.random() - 0.5) * AIR_CHUNK_SIZE * 2;
      const offsetZ = (Math.random() - 0.5) * AIR_CHUNK_SIZE * 2;
      
      // 设置高度
      const height = level.min + Math.random() * (level.max - level.min);
      
      // 设置UFO的位置
      ufo.position.set(offsetX, height, offsetZ);
      
      // 设置UFO的特殊运动特性
      const speedMultiplier = level.min < 100 ? 3.0 : (level.min < 300 ? 2.0 : 1.0); // 低空飞行更快
      ufo.userData.speed = (3.0 + Math.random() * 3.0) * speedMultiplier;
      ufo.userData.movementDirection = {
        x: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      };
      
      // 归一化方向向量
      const length = Math.sqrt(
        ufo.userData.movementDirection.x * ufo.userData.movementDirection.x +
        ufo.userData.movementDirection.z * ufo.userData.movementDirection.z
      );
      ufo.userData.movementDirection.x /= length;
      ufo.userData.movementDirection.z /= length;
      
      // UFO特殊行为 - 方向变化时间随高度增加
      const directionChangeTime = level.min < 100 ? 
                               (3 + Math.random() * 7) : // 低空: 3-10秒
                               (level.min < 300 ? 
                                (5 + Math.random() * 10) : // 中空: 5-15秒
                                (8 + Math.random() * 15)); // 高空: 8-23秒
      ufo.userData.directionChangeTime = directionChangeTime;
      ufo.userData.timeUntilChange = ufo.userData.directionChangeTime;
      
      // 根据高度调整缩放
      const scale = level.scale + Math.random() * 0.3; // 增加随机变化
      ufo.scale.set(scale, scale, scale);
      
      // 让UFO发出更强的光，低空UFO光照更强
      const lightIntensity = level.min < 100 ? 3 : (level.min < 300 ? 2 : 1);
      const lightDistance = level.min < 100 ? 150 : (level.min < 300 ? 120 : 100);
      ufo.children.forEach(child => {
        if (child.type === 'PointLight') {
          child.intensity = lightIntensity;
          child.distance = lightDistance;
        }
      });
      
      // 标记UFO高度类型
      ufo.userData.altitude = level.name;
      
      // 添加到空中物体组
      airObjects.add(ufo);
      
      console.log(`添加了一个${level.name}UFO，高度: ${Math.floor(height)}，速度: ${ufo.userData.speed.toFixed(1)}`);
    }
  });
  
  console.log(`总共添加了 ${altitudeLevels.reduce((sum, level) => sum + level.count, 0)} 个UFO`);
  return airObjects;
}

// 添加三个德国飞艇在不同高度
export function addGermanAirships() {
  // 设置三个不同的高度
  const heights = [
    { height: 200, scale: 3.6, name: "低空飞艇" },   // 从1.2增加到3.6
    { height: 500, scale: 3.0, name: "中空飞艇" },   // 从1.0增加到3.0
    { height: 800, scale: 2.4, name: "高空飞艇" }    // 从0.8增加到2.4
  ];
  
  heights.forEach((levelData, index) => {
    // 创建飞艇
    const zeppelin = createZeppelin();
    
    // 在玩家周围随机位置放置
    const angle = index * (Math.PI * 2 / 3); // 均匀分布在玩家周围
    const distance = 500 + Math.random() * 300;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // 设置飞艇位置和大小
    zeppelin.position.set(x, levelData.height, z);
    zeppelin.scale.set(levelData.scale, levelData.scale, levelData.scale);
    
    // 随机旋转
    zeppelin.rotation.y = Math.random() * Math.PI * 2;
    
    // 设置飞艇运动特性
    const speedFactor = 1.0 - (index * 0.2); // 高度越高速度越慢
    zeppelin.userData.speed = 2.0 * speedFactor;
    zeppelin.userData.movementDirection = {
      x: Math.cos(angle + Math.PI),
      z: Math.sin(angle + Math.PI)
    };
    
    // 方向变化时间随高度增加
    zeppelin.userData.directionChangeTime = 30 + index * 15; // 30秒、45秒、60秒
    zeppelin.userData.timeUntilChange = zeppelin.userData.directionChangeTime;
    
    // 标记名称
    zeppelin.userData.name = levelData.name;
    zeppelin.userData.altitude = `${levelData.height}米`;
    
    // 添加到空中物体组
    airObjects.add(zeppelin);
    
    console.log(`添加了${levelData.name}，高度: ${levelData.height}米`);
  });
  
  console.log('成功添加了三个德国齐柏林飞艇');
  return airObjects;
} 