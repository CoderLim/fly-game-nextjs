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
    
    // 对于热气球，添加轻微的上下飘动
    if (object.userData.type === 'balloon') {
      object.position.y += Math.sin(performance.now() * 0.0005) * 0.05;
    }
    
    // 对于无人机，添加不规则运动
    if (object.userData.type === 'drone') {
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