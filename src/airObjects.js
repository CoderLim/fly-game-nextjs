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
      balloonChance: 0.4,    // 热气球出现概率
      blimpChance: 0.3,      // 飞艇出现概率
      droneChance: 0.3,      // 无人机出现概率
      heightRanges: {        // 高度范围（米）
        balloon: { min: 100, max: 300 },
        blimp: { min: 200, max: 500 },
        drone: { min: 50, max: 150 }
      },
      speedFactor: 1.0,      // 速度系数
      movementDirection: { x: 0, z: -1 }  // 默认向北移动
    };
    
    // 根据天气调整规则
    switch (weather) {
      case 'sunny':
        // 晴天适合所有飞行器
        rules.balloonChance = 0.5;     // 更多热气球
        rules.speedFactor = 1.0;
        break;
        
      case 'cloudy':
        // 多云天气减少热气球，增加飞艇
        rules.balloonChance = 0.2;
        rules.blimpChance = 0.5;
        rules.heightRanges.balloon.max = 200; // 热气球飞得更低
        rules.speedFactor = 0.8;      // 整体速度较慢
        break;
        
      case 'windy':
        // 有风天气减少无人机，热气球飞得更低
        rules.droneChance = 0.1;
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

// 生成区块中的空中物体
function generateAirChunk(chunkX, chunkZ) {
  const chunkOriginX = chunkX * AIR_CHUNK_SIZE;
  const chunkOriginZ = chunkZ * AIR_CHUNK_SIZE;
  
  // 获取当前天气和生成规则
  const generationRules = weatherSystem.getGenerationRules();
  
  // 使用确定性随机数生成器
  const chunkSeed = chunkX * 10000 + chunkZ;
  const random = () => {
    const x = Math.sin(chunkSeed + loadedAirChunks.size) * 10000;
    return x - Math.floor(x);
  };
  
  // 根据当前天气决定区块中的物体数量
  let objectCount = AIR_OBJECTS_PER_CHUNK;
  if (generationRules.weather === 'rainy') {
    // 雨天减少空中物体
    objectCount = Math.max(1, Math.floor(AIR_OBJECTS_PER_CHUNK * 0.5));
  } else if (generationRules.weather === 'sunny') {
    // 晴天增加空中物体
    objectCount = AIR_OBJECTS_PER_CHUNK + 1;
  }
  
  // 标记商业区块 - 商业区块会有更多无人机
  const isCommercialDistrict = (Math.abs(chunkX + chunkZ) % 4 === 0);
  
  // 创建物体
  for (let i = 0; i < objectCount; i++) {
    // 根据概率选择空中物体类型
    const typeRoll = random();
    let airObject;
    let type;
    
    // 调整类型选择概率
    let balloonChance = generationRules.balloonChance;
    let blimpChance = generationRules.blimpChance;
    let droneChance = generationRules.droneChance;
    
    // 在商业区增加无人机概率
    if (isCommercialDistrict) {
      droneChance *= 1.5;
      // 归一化概率
      const sum = balloonChance + blimpChance + droneChance;
      balloonChance /= sum;
      blimpChance /= sum;
      droneChance /= sum;
    }
    
    if (typeRoll < balloonChance) {
      type = 'balloon';
      airObject = createHotAirBalloon();
    } else if (typeRoll < balloonChance + blimpChance) {
      type = 'blimp';
      airObject = createBlimp();
    } else {
      type = 'drone';
      airObject = createDrone();
    }
    
    // 根据类型设置高度范围
    const heightRange = generationRules.heightRanges[type];
    
    // 随机位置
    const x = chunkOriginX + random() * AIR_CHUNK_SIZE;
    const y = heightRange.min + random() * (heightRange.max - heightRange.min);
    const z = chunkOriginZ + random() * AIR_CHUNK_SIZE;
    
    airObject.position.set(x, y, z);
    
    // 根据天气系统设定的移动方向来确定物体朝向
    const direction = generationRules.movementDirection;
    airObject.rotation.y = Math.atan2(direction.x, direction.z);
    
    // 为动画添加一些随机属性，并根据天气调整
    airObject.userData.originalY = y;
    airObject.userData.floatSpeed = (0.05 + random() * 0.1) * generationRules.speedFactor;
    airObject.userData.floatAmplitude = 5 + random() * 10;
    
    // 飞艇和无人机有更大的旋转可能性
    if (type === 'blimp' || type === 'drone') {
      airObject.userData.rotationSpeed = 0.001 + random() * 0.002;
    } else {
      airObject.userData.rotationSpeed = 0.0005 + random() * 0.001; // 热气球旋转较慢
    }
    
    // 设置移动速度和方向 - 根据天气调整
    airObject.userData.moveForward = true; // 所有物体都在移动
    
    // 根据物体类型和天气设置速度
    if (type === 'balloon') {
      airObject.userData.forwardSpeed = (0.1 + random() * 0.2) * generationRules.speedFactor;
    } else if (type === 'blimp') {
      airObject.userData.forwardSpeed = (0.3 + random() * 0.4) * generationRules.speedFactor;
    } else { // drone
      airObject.userData.forwardSpeed = (0.5 + random() * 0.8) * generationRules.speedFactor;
    }
    
    // 添加移动方向矢量 - 考虑天气系统
    airObject.userData.movementDirection = {
      x: direction.x,
      z: direction.z
    };
    
    // 给很小一部分无人机设置巡逻行为
    if (type === 'drone' && random() > 0.7) {
      airObject.userData.isPatrolling = true;
      airObject.userData.patrolRadius = 30 + random() * 50;
      airObject.userData.patrolSpeed = 0.02 + random() * 0.03;
      airObject.userData.patrolCenter = {
        x: airObject.position.x,
        z: airObject.position.z
      };
      airObject.userData.patrolAngle = random() * Math.PI * 2;
    }
    
    airObjects.add(airObject);
  }
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

// 动画更新函数
export function updateAirObjects(deltaTime) {
  const time = Date.now() * 0.001; // 当前时间（秒）
  
  airObjects.children.forEach(object => {
    // 上下浮动
    if (object.userData.originalY) {
      object.position.y = object.userData.originalY + 
                          Math.sin(time * object.userData.floatSpeed) * 
                          object.userData.floatAmplitude;
    }
    
    // 缓慢旋转
    if (object.userData.rotationSpeed) {
      object.rotation.y += object.userData.rotationSpeed;
    }
    
    // 向前移动 - 基于物体的移动方向
    if (object.userData.moveForward && object.userData.forwardSpeed) {
      if (object.userData.isPatrolling) {
        // 巡逻模式 - 绕着中心点巡逻
        object.userData.patrolAngle += object.userData.patrolSpeed;
        const center = object.userData.patrolCenter;
        const radius = object.userData.patrolRadius;
        
        object.position.x = center.x + Math.cos(object.userData.patrolAngle) * radius;
        object.position.z = center.z + Math.sin(object.userData.patrolAngle) * radius;
        
        // 让无人机朝向移动方向
        const tangent = new THREE.Vector3(
          -Math.sin(object.userData.patrolAngle),
          0,
          Math.cos(object.userData.patrolAngle)
        );
        object.lookAt(
          object.position.clone().add(tangent)
        );
      } else if (object.userData.movementDirection) {
        // 标准移动模式 - 沿着指定方向
        const direction = new THREE.Vector3(
          object.userData.movementDirection.x,
          0,
          object.userData.movementDirection.z
        ).normalize();
        
        object.position.addScaledVector(direction, object.userData.forwardSpeed);
      } else {
        // 兼容旧代码的移动模式
        const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          object.rotation.y
        );
        object.position.addScaledVector(direction, object.userData.forwardSpeed);
      }
    }
    
    // 更新螺旋桨旋转
    if (object.userData.propeller) {
      object.userData.propeller.rotation.x += 0.2;
    }
    
    // 更新无人机多个螺旋桨
    if (object.userData.propellers) {
      object.userData.propellers.forEach(propeller => {
        propeller.rotation.y += propeller.userData.rotation;
      });
    }
  });
} 